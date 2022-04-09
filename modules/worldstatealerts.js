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
    },
    defection: {
        string: '<:defection:961938897829523566>',
        identifier: 'defection:961938897829523566'
    },
    defense: {
        string: '<:defense:961938213256179802>',
        identifier: 'defense:961938213256179802'
    },
    interception: {
        string: '<:interception:961937942488678401>',
        identifier: 'interception:961937942488678401'
    },
    salvage: {
        string: '<:salvage:961939373908164638>',
        identifier: 'salvage:961939373908164638'
    },
    survival: {
        string: '<:survival:961937707477655592>',
        identifier: 'survival:961937707477655592'
    },
    excavation: {
        string: '<:excavation:961938527266955324>',
        identifier: 'excavation:961938527266955324'
    },
    disruption: {
        string: '<:disruption:962048774388195328>',
        identifier: 'disruption:962048774388195328'
    },
    Lith: {
        string: '<:Lith:962457564493271051>',
        identifier: 'Lith:962457564493271051'
    },
    Meso: {
        string: '<:Meso:962457563092361257>',
        identifier: 'Meso:962457563092361257'
    },
    Neo: {
        string: '<:Neo:962457562844909588>',
        identifier: 'Neo:962457562844909588'
    },
    Axi: {
        string: '<:Axi:962457563423735868>',
        identifier: 'Axi:962457563423735868'
    },
    Requiem: {
        string: '<:Requiem:962457575230701598>',
        identifier: 'Requiem:962457575230701598'
    }
}
const colors = {
    baro: "#95744",
    cycles: "#a83258",
    arbitration: "#f59e42",
    fissures: "#3295a8"
}
//----set timers----
var baroTimer = setTimeout(baro_check,8000)
var cyclesTimer = setTimeout(cycles_check,10000)
var arbitrationTimer = setTimeout(arbitration_check,12000)
var fissuresTimer = setTimeout(fissures_check,14000)

async function wssetup(message,args) {
    if (!access_ids.includes(message.author.id)) {
        message.channel.send('You do not have access to this command').catch(err => console.log(err))
        return
    }
    message.channel.send({
        content: ' ',
        embeds: [{
            title: 'Worldstate Alerts Setup',
            description: '1️⃣ Baro Alert\n2️⃣ Open World Cycles\n3️⃣ Arbitration\n4️⃣ Fissures'
        }]
    }).then(msg => {
        msg.react('1️⃣').catch(err => console.log(err))
        msg.react('2️⃣').catch(err => console.log(err))
        msg.react('3️⃣').catch(err => console.log(err))
        msg.react('4️⃣').catch(err => console.log(err))
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
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
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
        baroTimer = setTimeout(baro_check, 10000)
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
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
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
        // ----- cyclesAlert
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Open World Cycles',
                description: `React to be notified upon cycle changes`,
                color: colors.cycles
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

        clearTimeout(cyclesTimer)
        var timer = 10000
        cyclesTimer = setTimeout(cycles_check, 10000)
        console.log('cycles_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.name == "3️⃣" && type=="add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
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
        // ---- arbitrationAlert
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Arbitration',
                description: `React to subscribe to specific mission types\n\n${emotes.defection.string} Defection | ${emotes.defense.string} Defense | ${emotes.interception.string} Interception | ${emotes.salvage.string} Salvage\n${emotes.survival.string} Survival | ${emotes.excavation.string} Excavation | ${emotes.disruption.string} Disruption`,
                color: colors.arbitration
            }]
        }).then(async msg => {
            db.query(`UPDATE worldstatealert SET arbitration_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
            await msg.react(emotes.defection.string).catch(err => console.log(err))
            await msg.react(emotes.defense.string).catch(err => console.log(err))
            await msg.react(emotes.interception.string).catch(err => console.log(err))
            await msg.react(emotes.salvage.string).catch(err => console.log(err))
            await msg.react(emotes.survival.string).catch(err => console.log(err))
            await msg.react(emotes.excavation.string).catch(err => console.log(err))
            await msg.react(emotes.disruption.string).catch(err => console.log(err))
        }).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})

        clearTimeout(arbitrationTimer)
        var timer = 10000
        arbitrationTimer = setTimeout(arbitration_check, 10000)
        console.log('arbitration_check invokes in ' + msToTime(timer))
    }
    if (reaction.emoji.name == "4️⃣" && type=="add") {
        if (!access_ids.includes(user.id))
            return
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Worldstate Alerts Setup")
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
        // ---- fissuresAlert
        await reaction.message.channel.send({
            content: ' ',
            embeds: [{
                title: 'Fissures',
                description: `Active fissures`,
                color: colors.fissures
            },{
                title: 'Void Storms',
                description: `Active railjack fissures`,
                color: colors.fissures
            }]
        }).then(async msg => {
            db.query(`UPDATE worldstatealert SET fissures_alert = ${msg.id} WHERE channel_id = ${channel_id}`).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})
        }).catch(err => {console.log(err);reaction.message.channel.send('Some error occured').catch(err => console.log(err))})

        clearTimeout(fissuresTimer)
        var timer = 10000
        fissuresTimer = setTimeout(fissures_check, 10000)
        console.log('fissures_check invokes in ' + msToTime(timer))
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
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{day,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Day cycle").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{day}', (cycles_users->'day') - '${user.id}')
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
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{night,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Night cycle").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{night}', (cycles_users->'night') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Night cycle").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.name == emotes.cold.string) {
        console.log('cold reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{cold,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Cold cycle").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{cold}', (cycles_users->'cold') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Cold cycle").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.name == emotes.warm.string) {
        console.log('warm reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{warm,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Warm cycle").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{warm}', (cycles_users->'warm') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Warm cycle").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.fass.identifier) {
        console.log('fass reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{fass,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Fass cycle").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{fass}', (cycles_users->'fass') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Fass cycle").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.vome.identifier) {
        console.log('vome reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Open World Cycles")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{vome,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Vome cycle").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET cycles_users = jsonb_set(cycles_users, '{vome}', (cycles_users->'vome') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Vome cycle").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.defection.identifier) {
        console.log('defection reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{defection,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration defection").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{defection}', (arbitration_users->'defection') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration defection").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.defense.identifier) {
        console.log('defense reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{defense,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration defense").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{defense}', (arbitration_users->'defense') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration defense").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.interception.identifier) {
        console.log('interception reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{interception,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration interception").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{interception}', (arbitration_users->'interception') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration interception").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.salvage.identifier) {
        console.log('salvage reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{salvage,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration salvage").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{salvage}', (arbitration_users->'salvage') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration salvage").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.survival.identifier) {
        console.log('survival reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{survival,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration survival").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{survival}', (arbitration_users->'survival') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration survival").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.excavation.identifier) {
        console.log('excavation reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{excavation,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration excavation").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{excavation}', (arbitration_users->'excavation') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration excavation").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
    if (reaction.emoji.identifier == emotes.disruption.identifier) {
        console.log('disruption reaction')
        if (!reaction.message.author)
            await reaction.message.channel.messages.fetch(reaction.message.id).catch(err => console.log(err))
        if (reaction.message.author.id != client.user.id)
            return
        if (reaction.message.embeds[0].title != "Arbitration")
            return
        if (type == "add") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{disruption,999999}', '"${user.id}"', true)
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Added tracker: Arbitration disruption").catch(err => console.log(err))).catch(err => console.log(err))
        } else if (type == "remove") {
            db.query(`
                UPDATE worldstatealert
                SET arbitration_users = jsonb_set(arbitration_users, '{disruption}', (arbitration_users->'disruption') - '${user.id}')
                WHERE channel_id = ${channel_id};
            `).then(() => user.send("Removed tracker: Arbitration disruption").catch(err => console.log(err))).catch(err => console.log(err))
        }
    }
}

//----tracking----

async function baro_check() {
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( worldstateData => {
        
        const voidTrader = new WorldState(JSON.stringify(worldstateData.data)).voidTrader;
        
        if (!voidTrader) {
            console.log('Baro check: no data available')
            var timer = 300000
            baroTimer = setTimeout(baro_check, timer)
            console.log(`baro_check reset in ${msToTime(timer)}`)
            return
        }

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
                        if (row.baro_alert)
                            client.channels.cache.get(row.channel_id).send(`Baro has arrived! <@&${row.baro_role}>`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
                    })
                }
                var embed = {
                    title: "Baro Ki'teer", 
                    description: `Baro has arrived! Leaving <t:${new Date(voidTrader.expiry).getTime() / 1000}:R>\n**Node:** ${voidTrader.location}`,
                    fields: [], 
                    color: colors.baro
                }
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
                                    title: "Baro Ki'teer",
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
            var timer = (new Date(voidTrader.expiry).getTime() - new Date().getTime()) + 120000
            baroTimer = setTimeout(baro_check, timer)
            console.log('baro_check invokes in ' + msToTime(timer))
        } else {
            var timer = (new Date(voidTrader.activation).getTime() - new Date().getTime()) + 120000
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
        
        if (!cetusCycle || !vallisCycle || !cambionCycle) {
            console.log('Cycles check: no data available for a certain node')
            var timer = 300000
            arbitrationTimer = setTimeout(cycles_check, timer)
            console.log(`cycles_check reset in ${msToTime(timer)}`)
            return
        }

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
            var ping_users = {}
            var cycles_changed = []
            // ----- cetus check 
            db.query(`UPDATE worldstatealert SET cetus_status = '${cetusCycle.state}'`).catch(err => console.log(err))
            res.rows.forEach(row => {
                row.cycles_users[cetusCycle.state].forEach(user => {
                    if (!users[row.channel_id])
                        users[row.channel_id] = []
                    if (!users[row.channel_id].includes(`<@${user}>`))
                        users[row.channel_id].push(`<@${user}>`)
                    if (res.rows[0].cetus_status != cetusCycle.state) {
                        if (!cycles_changed.includes(`Cetus`))
                            cycles_changed.push(`Cetus`)
                        if (!ping_users[row.channel_id])
                            ping_users[row.channel_id] = []
                        if (!ping_users[row.channel_id].includes(`<@${user}>`))
                            ping_users[row.channel_id].push(`<@${user}>`)
                    }
                })
            })
            // ----- vallis check
            db.query(`UPDATE worldstatealert SET vallis_status = '${vallisCycle.state}'`).catch(err => console.log(err))
            res.rows.forEach(row => {
                row.cycles_users[vallisCycle.state].forEach(user => {
                    if (!users[row.channel_id])
                        users[row.channel_id] = []
                    if (!users[row.channel_id].includes(`<@${user}>`))
                        users[row.channel_id].push(`<@${user}>`)
                    if (res.rows[0].vallis_status != vallisCycle.state) {
                        if (!cycles_changed.includes(`Orb Vallis`))
                            cycles_changed.push(`Orb Vallis`)
                        if (!ping_users[row.channel_id])
                            ping_users[row.channel_id] = []
                        if (!ping_users[row.channel_id].includes(`<@${user}>`))
                            ping_users[row.channel_id].push(`<@${user}>`)
                    }
                })
            })
            // ----- cambion check
            db.query(`UPDATE worldstatealert SET cambion_status = '${cambionCycle.active}'`).catch(err => console.log(err))
            res.rows.forEach(row => {
                row.cycles_users[cambionCycle.active].forEach(user => {
                    if (!users[row.channel_id])
                        users[row.channel_id] = []
                    if (!users[row.channel_id].includes(`<@${user}>`))
                        users[row.channel_id].push(`<@${user}>`)
                    if (res.rows[0].cambion_status != cambionCycle.active) {
                        if (!cycles_changed.includes(`Cambion Drift`))
                            cycles_changed.push(`Cambion Drift`)
                        if (!ping_users[row.channel_id])
                            ping_users[row.channel_id] = []
                        if (!ping_users[row.channel_id].includes(`<@${user}>`))
                            ping_users[row.channel_id].push(`<@${user}>`)
                    }
                })
            })
            console.log('Cycles check: user mention lists' + JSON.stringify(users) + JSON.stringify(ping_users))
            // ---- construct embed
            var embed = {
                title: 'Open World Cycles', 
                description: 'React to be notified upon cycle changes', 
                fields: [{
                    name: '__Cetus__',
                    value: `${emotes[cetusCycle.state].string} ${cetusCycle.state.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n${cetusCycle.state == "day" ? `${emotes.night.string} Starts <t:${new Date(cetusCycle.expiry).getTime() / 1000}:R>` : `${emotes.day.string} Starts <t:${new Date(cetusCycle.expiry).getTime() / 1000}:R>`}`,
                    inline: true
                },{
                    name: '__Orb Vallis__',
                    value: `${emotes[vallisCycle.state].string} ${vallisCycle.state.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n${vallisCycle.state == "cold" ? `Becomes ${emotes.warm.string} <t:${new Date(vallisCycle.expiry).getTime() / 1000}:R>` : `Becomes ${emotes.cold.string} <t:${new Date(vallisCycle.expiry).getTime() / 1000}:R>`}`,
                    inline: true
                },{
                    name: '__Cambion Drift__',
                    value: `${emotes[cambionCycle.active].string} ${cambionCycle.active.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n${cambionCycle.active == "fass" ? `${emotes.vome.string} Spawns <t:${new Date(cambionCycle.expiry).getTime() / 1000}:R>` : `${emotes.fass.string} Spawns <t:${new Date(cambionCycle.expiry).getTime() / 1000}:R>`}`,
                    inline: true
                }],
                color: colors.cycles
            }
            //console.log(JSON.stringify(embed))
            // ---- send msg
            res.rows.forEach(row => {
                if (row.cycles_alert) {
                    client.channels.cache.get(row.channel_id).messages.fetch(row.cycles_alert).then(msg => {
                        msg.edit({
                            content: users[row.channel_id] ? users[row.channel_id].join(', ') : ' ',
                            embeds: [embed]
                        }).catch(err => console.log(err))
                    }).catch(err => console.log(err))
                    if (ping_users[row.channel_id])
                        client.channels.cache.get(row.channel_id).send(`${cycles_changed.join(', ')} Cycle changed ${ping_users[row.channel_id].join(', ')}`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
                }
            })
        })
        var expiry = new Date(cetusCycle.expiry).getTime()
        if (expiry > new Date(vallisCycle.expiry).getTime())
            expiry = new Date(vallisCycle.expiry).getTime()
        if (expiry > new Date(cambionCycle.expiry).getTime())
            expiry = new Date(cambionCycle.expiry).getTime()

        var timer = expiry - new Date().getTime()
        cyclesTimer = setTimeout(cycles_check, timer)
        console.log('cycles_check invokes in ' + msToTime(timer))
        return
    })
    .catch(err => {
        console.log(err)
        cyclesTimer = setTimeout(cycles_check,5000)
    })
}

async function arbitration_check() {
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( async worldstateData => {
        
        var arbitration = new WorldState(JSON.stringify(worldstateData.data)).arbitration;

        if (!arbitration) {
            console.log('Arbitration check: getting data from warframestat.us')
            var status = await axios('https://api.warframestat.us/pc/arbitration')    // get data from warframestat.us
            .then(res => {
                arbitration = res.data
                return true
            }).catch(err => {
                console.log(err)
                return false
            })
            if (!status) {
                console.log('Arbitration check: no data available')
                var timer = 300000
                arbitrationTimer = setTimeout(arbitration_check, timer)
                console.log(`arbitration_check reset in ${msToTime(timer)}`)
                return
            }
        }

        if (!arbitration.type || typeof(arbitration.type) != "string") {
            console.log('Arbitration check: arbitrary data')
            var timer = 10000
            arbitrationTimer = setTimeout(arbitration_check, timer)
            console.log(`arbitration_check reset in ${msToTime(timer)}`)
            return
        }
        
        if (new Date(arbitration.expiry).getTime() < new Date().getTime()) {     //negative expiry, retry
            console.log('Arbitration check: negative expiry')
            var timer = 10000
            arbitrationTimer = setTimeout(arbitration_check, timer)
            console.log(`arbitration_check reset in ${msToTime(timer)}`)
            return
        }
        db.query(`SELECT * FROM worldstatealert`).then(res => {
            if (res.rowCount == 0)
                return
            var users = {}
            var ping_users = {}
            var mission = "unknown"
            try {
                if (arbitration.type.match('Defection'))
                    mission = 'defection'
                else if (arbitration.type.match('Defense'))
                    mission = 'defense'
                else if (arbitration.type.match('Interception'))
                    mission = 'interception'
                else if (arbitration.type.match('Salvage'))
                    mission = 'salvage'
                else if (arbitration.type.match('Survival'))
                    mission = 'survival'
                else if (arbitration.type.match('Excavation'))
                    mission = 'excavation'
                else if (arbitration.type.match('Disruption'))
                    mission = 'disruption'
                if (mission == "unknown") {
                    inform_dc('Arbitration check: mission is ' + mission + ` (${arbitration.type})`)
                    console.log('Arbitration check: mission type unknown')
                    var timer = 300000
                    arbitrationTimer = setTimeout(arbitration_check, timer)
                    console.log(`arbitration_check reset in ${msToTime(timer)}`)
                    return
                }
                console.log('Arbitration check: mission is ' + mission + ` (${arbitration.type})`)
            } catch (e) {
                console.log(e)
                console.log('Arbitration check: unknown error')
                console.log(arbitration)
                var timer = 10000
                arbitrationTimer = setTimeout(arbitration_check, timer)
                console.log(`arbitration_check reset in ${msToTime(timer)}`)
                return
            }
            // -----
            db.query(`UPDATE worldstatealert SET arbitration_mission = '${mission}_${arbitration.enemy}'`).catch(err => console.log(err))
            res.rows.forEach(row => {
                row.arbitration_users[mission].forEach(user => {
                    if (!users[row.channel_id])
                        users[row.channel_id] = []
                    if (!users[row.channel_id].includes(`<@${user}>`))
                        users[row.channel_id].push(`<@${user}>`)
                    if (res.rows[0].arbitration_mission != `${mission}_${arbitration.enemy}`) {
                        if (!ping_users[row.channel_id])
                            ping_users[row.channel_id] = []
                        if (!ping_users[row.channel_id].includes(`<@${user}>`))
                            ping_users[row.channel_id].push(`<@${user}>`)
                    }
                })
            })
            console.log('Arbitration check: user mention lists' + JSON.stringify(users) + JSON.stringify(ping_users))
            // ---- construct embed
            var embed = {
                title: 'Arbitration', 
                description: `React to subscribe to specific mission types\n\n${emotes.defection.string} Defection | ${emotes.defense.string} Defense | ${emotes.interception.string} Interception | ${emotes.salvage.string} Salvage\n${emotes.survival.string} Survival | ${emotes.excavation.string} Excavation | ${emotes.disruption.string} Disruption\n\n**Mission**: ${arbitration.type}\n**Faction**: ${arbitration.enemy}\n**Node**: ${arbitration.node}\nExpires <t:${new Date(arbitration.expiry).getTime() / 1000}:R>`, 
                color: colors.arbitration
            }
            console.log(JSON.stringify(embed))
            // ---- send msg
            res.rows.forEach(row => {
                if (row.arbitration_alert) {
                    client.channels.cache.get(row.channel_id).messages.fetch(row.arbitration_alert).then(msg => {
                        msg.edit({
                            content: users[row.channel_id] ? users[row.channel_id].join(', ') : ' ',
                            embeds: [embed]
                        }).catch(err => console.log(err))
                    }).catch(err => console.log(err))
                    if (ping_users[row.channel_id])
                        client.channels.cache.get(row.channel_id).send(`Arbitration mission has appeared ${ping_users[row.channel_id].join(', ')}`).then(msg => setTimeout(() => msg.delete().catch(err => console.log(err)), 10000)).catch(err => console.log(err))
                }
            })
        })
        var timer = new Date(arbitration.expiry).getTime() - new Date().getTime()
        arbitrationTimer = setTimeout(arbitration_check, timer)
        console.log('arbitration_check invokes in ' + msToTime(timer))
        return
    })
    .catch(err => {
        console.log(err)
        arbitrationTimer = setTimeout(arbitration_check,5000)
        return
    })
}


async function fissures_check() {
    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( worldstateData => {
        
        const fissures = new WorldState(JSON.stringify(worldstateData.data)).fissures;
        
        if (!fissures) {
            console.log('Fissures check: no data available')
            var timer = 300000
            fissuresTimer = setTimeout(fissures_check, timer)
            console.log(`fissures_check reset in ${msToTime(timer)}`)
            return
        }

        db.query(`SELECT * FROM worldstatealert`).then(res => {
            if (res.rowCount == 0)
                return

            var fissures_list = {normal: [], voidStorm: []}
            var min_expiry = new Date().getTime() + 3600000
            fissures.forEach(fissure => {
                var expiry = new Date(fissure.expiry).getTime()
                if ((expiry - new Date().getTime()) > 0) {
                    if (expiry < min_expiry)
                        min_expiry = expiry
                    if (fissure.isStorm)
                        fissures_list.voidStorm.push(fissure)
                    else
                        fissures_list.normal.push(fissure)
                }
            })
            fissures_list.normal.sort(dynamicSort("tierNum"))
            fissures_list.voidStorm.sort(dynamicSort("tierNum"))

            var embed1 = {
                title: "Fissures",
                fields: [{
                    name: "Tier",
                    value: "",
                    inline: true
                },{
                    name: "Mission",
                    value: "",
                    inline: true
                },{
                    name: "Expires",
                    value: "",
                    inline: true
                }],
                color: colors.fissures
            }
            var embed2 = {
                title: "Railjack Fissures",
                fields: [{
                    name: "Tier",
                    value: "",
                    inline: true
                },{
                    name: "Mission",
                    value: "",
                    inline: true
                },{
                    name: "Expires",
                    value: "",
                    inline: true
                }],
                color: colors.fissures
            }

            fissures_list.normal.forEach(fissure => {
                embed1.fields[0].value += `${emotes[fissure.tier].string} ${fissure.tier}\n`
                embed1.fields[1].value += `${fissure.missionType} - ${fissure.node}\n`
                embed1.fields[2].value += `<t:${Math.round(new Date(fissure.expiry).getTime() / 1000)}:R>\n`
            })
            fissures_list.voidStorm.forEach(fissure => {
                embed2.fields[0].value += `${emotes[fissure.tier].string} ${fissure.tier}\n`
                embed2.fields[1].value += `${fissure.missionType} - ${fissure.node}\n`
                embed2.fields[2].value += `<t:${Math.round(new Date(fissure.expiry).getTime() / 1000)}:R>\n`
            })

            res.rows.forEach(row => {
                if (row.fissures_alert) {
                    client.channels.cache.get(row.channel_id).messages.fetch(row.fissures_alert).then(msg => {
                        msg.edit({
                            content: ' ',
                            embeds: [embed1, embed2]
                        }).catch(err => console.log(err))
                    }).catch(err => console.log(err))
                }
            })

            var timer = min_expiry - new Date().getTime()
            fissuresTimer = setTimeout(fissures_check, timer)
            console.log('fissures_check invokes in ' + msToTime(timer))
        })
        return
    })
    .catch(err => {
        console.log(err)
        fissuresTimer = setTimeout(fissures_check,5000)
    })
}

module.exports = {wssetup,setupReaction};