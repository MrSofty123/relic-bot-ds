const {client} = require('./discord_client.js');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const {db} = require('./db_connection.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,mod_log,getRandomColor} = require('./extras.js');
const WorldState = require('warframe-worldstate-parser');
const access_ids = [
    '253525146923433984'
]
const emotes = {
    baro: {
        string: '<:baro:961548844368293969>',
        identifier: 'baro:961548844368293969'
    },
    credits: {
        string: '<:credits:961605300601913424>',
        identifier: 'credits:961605300601913424'
    },
    ducats: {
        string: '<:ducats:961605317425234000>',
        identifier: 'ducats:961605317425234000'
    },
    day: {
        string: '☀️',
        identifier: '☀️'
    },
    night: {
        string: '🌙',
        identifier: '🌙'
    },
    cold: {
        string: '❄️',
        identifier: '❄️'
    },
    warm: {
        string: '🔥',
        identifier: '🔥'
    },
    fass: {
        string: '<:fass:961853261961371670>',
        identifier: 'fass:961853261961371670'
    },
    vome: {
        string: '<:vome:961853261713907752>',
        identifier: 'vome:961853261713907752'
    }
}
const colors = {
    baro: "#95744",
    cycleArbitrationFissure: "#a83258"
}
//----set timers----
var baroTimer = setTimeout(baro_check,8000)
var cyclesTimer = setTimeout(cycles_check,10000)

async function wssetup(message,args) {
    if (!access_ids.includes(message.author.id)) {
        message.channel.send('You do not have access to this command').catch(err => console.log(err))
        return
    }
    message.channel.send({
        content: ' ',
        embeds: [{
            title: 'Worldstate Alerts Setup',
            description: '1️⃣ Baro Alert\n2️⃣ Cycles | Arbitration | Fissures'
        }]
    }).then(msg => {
        msg.react('1️⃣').catch(err => console.log(err))
        msg.react('2️⃣').catch(err => console.log(err))
    }).catch(err => console.log(err))
}

async function setupReaction(reaction,user,type) {
    const channel_id = reaction.message.channel.id
    if (reaction.emoji.name == "1️⃣" && type=="add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title === "Worldstate Alerts Setup")
            return
        var status = db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            if (res.rowCount == 1)
                return true
            return false
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(err => console.log(err))
            return
        }
        await reaction.message.channel.send('https://cdn.discordapp.com/attachments/943131999189733387/961559893142282270/alerts_baro_kiteer.png').catch(err => console.log(err))
        // ----- baroAlert
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                description: `React with ${emotes.baro.string} to be notified when baro arrives`,
                color: colors.baro
            }]
        }).then(msg => {
            msg.react(emotes.baro.string).catch(err => console.log(err))
            db.query(`UPDATE worldstatealert SET baro_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
        }).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
        // ----- baroRole
        reaction.message.guild.roles.create({
            name: 'Baro Alert',
            reason: 'Automatic role creation',
        }).then(role => {
            db.query(`UPDATE worldstatealert SET baro_role = ${role.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
        }).catch(err => console.log(err))
        clearTimeout(baroTimer)
        var timer = 10000
        setTimeout(baro_check, 10000)
        console.log('baro_check invokes in ' + msToTime(timer))
        return
    }
    if (reaction.emoji.name == "2️⃣" && type=="add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title === "Worldstate Alerts Setup")
            return
        var status = db.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}) THEN
                    INSERT INTO worldstatealert (channel_id) VALUES (${channel_id});
                END IF;
            END $$;
        `).then(res => {
            if (res.rowCount == 1)
                return true
            return false
        }).catch(err => {
            console.log(err)
            return false
        })
        if (!status) {
            reaction.message.channel.send('Some error occured').catch(err => console.log(err))
            return
        }
        await reaction.message.channel.send('https://cdn.discordapp.com/attachments/943131999189733387/961640420658528326/alerts_cycles_arbitration_fissures.png').catch(err => console.log(err))
        // ----- cyclesAlert
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Open worlds State',
                description: `React to be notified upon cycle changes`,
                color: colors.cycleArbitrationFissure
            }]
        }).then(async msg => {
            db.query(`UPDATE worldstatealert SET cycles_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
            await msg.react("☀️").catch(err => console.log(err))
            await msg.react("🌙").catch(err => console.log(err))
            await msg.react("❄️").catch(err => console.log(err))
            await msg.react("🔥").catch(err => console.log(err))
            await msg.react(emotes.fass.string).catch(err => console.log(err))
            await msg.react(emotes.vome.string).catch(err => console.log(err))
        }).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
        // ----
        clearTimeout(cyclesTimer)
        var timer = 10000
        setTimeout(cycles_check, 10000)
        console.log('cycles_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.identifier == emotes.baro.identifier) {
        console.log('baro reaction')
        await db.query(`SELECT * FROM worldstatealert WHERE channel_id = ${channel_id}`).then(res => {
            console.log(res.rows)
            if (res.rowCount != 1)
                return
            if (reaction.message.id != res.rows[0].baro_alert)
                return
            const role = reaction.message.guild.roles.cache.find(role => role.id === res.rows[0].baro_role)
            if (type == "add") {
                reaction.message.guild.members.cache.get(user.id).roles.add(role)
                .then(response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** added on server **' + reaction.message.guild.name + '**')
                    .catch(err => {
                        console.log(err)
                    })
                })
                .catch(function (error) {
                    console.log(`${error} Error adding role ${role.name} for user ${user.username}`)
                    user.send('Error occured adding role. Please try again.\nError Code: 500')
                    inform_dc(`Error adding role ${role.name} for user ${user.username}`)
                })
            } else if (type == "remove") {
                reaction.message.guild.members.cache.get(user.id).roles.remove(role)
                .then(response => {
                    console.log(JSON.stringify(response))
                    user.send('Role **' + role.name + '** removed on server **' + reaction.message.guild.name + '**')
                    .catch(err => {
                        console.log(err)
                    })
                })
                .catch(function (error) {
                    console.log(`${error} Error removing role ${role.name} for user ${user.username}`)
                    user.send('Error occured removing role. Please try again.\nError Code: 500')
                    inform_dc(`Error removing role ${role.name} for user ${user.username}`)
                })
            }
        })
    }
    if (reaction.emoji.name == emotes.day.string) {
        console.log('day reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open worlds State")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET users = jsonb_set(users, '{day,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Day cycle").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE test_table
                SET users = jsonb_set(users, '{day}', (users->'day') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Day cycle").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.name == emotes.night.string) {
        console.log('night reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open worlds State")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET users = jsonb_set(users, '{night,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Day cycle").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE test_table
                SET users = jsonb_set(users, '{night}', (users->'night') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Night cycle").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.name == emotes.cold.string) {
        console.log('cold reaction')
    }
    if (reaction.emoji.name == emotes.warm.string) {
        console.log('warm reaction')
    }
    if (reaction.emoji.identifier == emotes.fass.identifier) {
        console.log('fass reaction')
    }
    if (reaction.emoji.identifier == emotes.vome.identifier) {
        console.log('vome reaction')
    }
}

//----tracking----

async function baro_check() {
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( worldstateData => {
        
        const voidTrader = new WorldState(JSON.stringify(worldstateData.data)).voidTrader;
        
        if (voidTrader.active) {
            if (new Date(voidTrader.expiry).getTime() < new Date().getTime()) {     //negative expiry, retry
                console.log('Baro check: negative expiry')
                var timer = 10000
                baroTimer = setTimeout(baro_check, timer)
                console.log(`baro_check reset in ${msToTime(timer)}`)
                return
            }
        } else {
            if (new Date(voidTrader.activation).getTime() < new Date().getTime()) {     //negative activation, retry
                console.log('Baro check: negative activation')
                var timer = 10000
                baroTimer = setTimeout(baro_check, timer)
                console.log(`baro_check reset in ${msToTime(timer)}`)
                return
            }
        }
        db.query(`SELECT * FROM worldstatealert`).then(res => {
            if (res.rowCount == 0)
                return
            if (voidTrader.active) {
                if (res.rows[0].baro_status == false) {
                    db.query(`UPDATE worldstatealert SET baro_status = true`).catch(err => console.log(err))
                    res.rows.forEach(row => {
                        client.channels.cache.get(row.channel_id).send(`<@&${row.baro_role}>`)
                    })
                }
                var embed = {description: `Baro has arrived! Leaving <t:${new Date(voidTrader.expiry).getTime() / 1000}:R>\n**Node:** ${voidTrader.location}`,fields: [], color: colors.baro}
                voidTrader.inventory.forEach(item => {
                    embed.fields.push({
                        name: item.item,
                        value: `${emotes.credits.string} ${item.credits}\n${emotes.ducats.string} ${item.ducats}`,
                        inline: true
                    })
                })
                console.log(JSON.stringify(embed))
                res.rows.forEach(row => {
                    if (row.baro_alert) {
                        client.channels.cache.get(row.channel_id).messages.fetch(row.baro_alert).then(msg => {
                            msg.edit({
                                content: `<@&${row.baro_role}>`,
                                embeds: [embed]
                            }).catch(err => console.log(err))
                        }).catch(err => console.log(err))
                        client.channels.cache.get(row.channel_id).send(`Baro has arrived! <@&${row.baro_role}>`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err), 10000))).catch(err => console.log(err))
                    }
                })
            } else {
                db.query(`UPDATE worldstatealert SET baro_status = false`).catch(err => console.log(err))
                res.rows.forEach(row => {
                    if (row.baro_alert) {
                        client.channels.cache.get(row.channel_id).messages.fetch(row.baro_alert).then(msg => {
                            msg.edit({
                                content: ' ',
                                embeds: [{
                                    description: `React with ${emotes.baro.string} to be notified when baro arrives\n\nNext arrival <t:${new Date(voidTrader.activation).getTime() / 1000}:R>\n**Node:** ${voidTrader.location}`,
                                    color: colors.baro
                                }]
                            }).catch(err => console.log(err))
                        }).catch(err => console.log(err))
                    }
                })
            }
        })
        if (voidTrader.active) {
            var timer = (new Date(voidTrader.expiry).getTime() - new Date()) + 120000
            baroTimer = setTimeout(baro_check, timer)
            console.log('baro_check invokes in ' + msToTime(timer))
        } else {
            var timer = (new Date(voidTrader.activation).getTime() - new Date()) + 120000
            baroTimer = setTimeout(baro_check, timer)
            console.log('baro_check invokes in ' + msToTime(timer))
        }
        return
    })
    .catch(err => {
        console.log(err)
        baroTimer = setTimeout(baro_check,5000)
    })
}

async function cycles_check() {
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( worldstateData => {
        
        const cetusCycle = new WorldState(JSON.stringify(worldstateData.data)).cetusCycle;
        const vallisCycle = new WorldState(JSON.stringify(worldstateData.data)).vallisCycle;
        const cambionCycle = new WorldState(JSON.stringify(worldstateData.data)).cambionCycle;
        
        if (new Date(cetusCycle.expiry).getTime() < new Date().getTime() || new Date(vallisCycle.expiry).getTime() < new Date().getTime() || new Date(cambionCycle.expiry).getTime() < new Date().getTime()) {     //negative expiry, retry
            console.log('Cycles check: negative expiry')
            var timer = 10000
            cyclesTimer = setTimeout(cycles_check, timer)
            console.log(`cycles_check reset in ${msToTime(timer)}`)
            return
        }
        db.query(`SELECT * FROM worldstatealert`).then(res => {
            if (res.rowCount == 0)
                return
            var users = {}
            // ----- cetus check 
            if (res.rows[0].cetus_status != cetusCycle.state) {
                db.query(`UPDATE worldstatealert SET cetus_status = '${cetusCycle.state}'`).catch(err => console.log(err))
                res.rows.forEach(row => {
                    row.cycles_users[cetusCycle.state].forEach(user => {
                        if (!users[row.channel_id])
                            users[row.channel_id] = []
                        users[row.channel_id].push(`<@${user}>`)
                    })
                })
            }
            // ----- vallis check
            if (res.rows[0].vallis_status != vallisCycle.state) {
                db.query(`UPDATE worldstatealert SET vallis_status = '${vallisCycle.state}'`).catch(err => console.log(err))
                res.rows.forEach(row => {
                    row.cycles_users[vallisCycle.state].forEach(user => {
                        if (!users[row.channel_id])
                            users[row.channel_id] = []
                        users[row.channel_id].push(`<@${user}>`)
                    })
                })
            }
            // ----- cambion check
            if (res.rows[0].cambion_status != cambionCycle.active) {
                db.query(`UPDATE worldstatealert SET cambion_status = '${cambionCycle.active}'`).catch(err => console.log(err))
                res.rows.forEach(row => {
                    row.cycles_users[cambionCycle.active].forEach(user => {
                        if (!users[row.channel_id])
                            users[row.channel_id] = []
                        users[row.channel_id].push(`<@${user}>`)
                    })
                })
            }
            console.log('Cycles check: user mentions list\n' + JSON.stringify(users))
            // ---- construct embed
            var embed = {
                title: 'Open worlds State', 
                description: 'React to be notified upon cycle changes', 
                fields: [{
                    name: '__Cetus__',
                    value: `${emotes[cetusCycle.state].string} ${cetusCycle.state.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n${cetusCycle.state == "day" ? `${emotes.night.string} starts <t:${new Date(cetusCycle.expiry).getTime() / 1000}:R>` : `${emotes.day.string} starts <t:${new Date(cetusCycle.expiry).getTime() / 1000}:R>`}`,
                    inline: true
                },{
                    name: '__Orb Vallis__',
                    value: `${emotes[vallisCycle.state].string} ${vallisCycle.state.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n${vallisCycle.state == "cold" ? `Becomes ${emotes.warm.string} <t:${new Date(vallisCycle.expiry).getTime() / 1000}:R>` : `Becomes ${emotes.cold.string} <t:${new Date(vallisCycle.expiry).getTime() / 1000}:R>`}`,
                    inline: true
                },{
                    name: '__Cambion Drift__',
                    value: `${emotes[cambionCycle.active].string} ${cambionCycle.active.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n${cambionCycle.active == "fass" ? `${emotes.vome.string} spawns <t:${new Date(cambionCycle.expiry).getTime() / 1000}:R>` : `${emotes.fass.string} spawns <t:${new Date(cambionCycle.expiry).getTime() / 1000}:R>`}`,
                    inline: true
                }],
                color: colors.cycleArbitrationFissure
            }
            console.log(JSON.stringify(embed))
            // ---- send msg
            res.rows.forEach(row => {
                if (row.cycles_alert) {
                    client.channels.cache.get(row.channel_id).messages.fetch(row.cycles_alert).then(msg => {
                        msg.edit({
                            content: users[row.channel_id] ? users[row.channel_id].join(', ') : ' ',
                            embeds: [embed]
                        }).catch(err => console.log(err))
                    }).catch(err => console.log(err))
                    if (users[row.channel_id])
                        client.channels.cache.get(row.channel_id).send(`Cycle changed ${users[row.channel_id].join(', ')}`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err), 10000))).catch(err => console.log(err))
                }
            })
        })
        var expiry = new Date(cetusCycle.expiry).getTime()
        if (expiry > new Date(vallisCycle.expiry).getTime())
            expiry = new Date(vallisCycle.expiry).getTime()
        if (expiry > new Date(cambionCycle.expiry).getTime())
            expiry = new Date(cambionCycle.expiry).getTime()

        var timer = expiry - new Date()
        cyclesTimer = setTimeout(cycles_check, timer)
        console.log('cycles_check invokes in ' + msToTime(timer))
        return
    })
    .catch(err => {
        console.log(err)
        cyclesTimer = setTimeout(cycles_check,5000)
    })
}

module.exports = {wssetup,setupReaction};