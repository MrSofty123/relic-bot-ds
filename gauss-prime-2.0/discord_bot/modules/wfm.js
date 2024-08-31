const { Message, } = require("discord.js");
const { client } = require("./client");

const { wfmItemOrders } = require('./embeds');
const { getItemOrders, matchItems } = require("../sdk/api");

const{ getItemByTitle} = require("../sdk/api");
const axios = require('axios')
/**
 * 
 * @param {Message<boolean>} message 
 */
async function ordersCommand(message, args) {
    try {
        const items_matched = await matchItems({ item_name: args })
        if (items_matched.length === 0) return message.channel.send({ content: `No items matched **${args}**` })

        const _message = await message.channel.send({ content: 'Processing' })

        const response_embed = (await Promise.allSettled(items_matched.map((item) => getResponseEmbed(item)))).map(el => el.value)
        _message.edit({ content: 'React with :up: to update', embeds: response_embed }).catch(console.error)
        console.log('Responded with WFM Top sell orders!', _message.id);
        _message.react('🆙').catch(console.error)
        message.react('☑️').catch(console.error)

        // const Filter_client = (reaction, user) => {
        //     return reaction.emoji.name === '🆙' && user.id != client.user.id
        // }

        // const collector_client = _message.createReactionCollector({ filter: Filter_client })

        // collector_client.on('collect', async (reaction, user) => {
        //     response_embed = response_embed.map((item) => {
        //         item.title = item.title + ' (Updating...)'
        //         return item
        //     })
        //     // console.log(response_embed)
        //     _message.edit({ embeds: response_embed }).catch(console.error)
        //     response_embed = (await Promise.allSettled(items_matched.map((item) => getResponseEmbed(item)))).map(el => el.value)
        //     // console.log(response_embed)
        //     _message.edit({ content: 'React with :up: to update', embeds: response_embed }).catch(console.error)
        //     console.log("orders updated")
        //     reaction.users.remove(user).catch(console.error)
        // })

        async function getResponseEmbed(item) {
            return new Promise(async (resolve, reject) => {
                try {
                    // const orders = await axios.get(process.env.API_URL + `/api/wfm/item/orders?url_name=${item.url_name}`).then(r => r.data)
                    const orders = await getItemOrders(item)
                    const item_embed = wfmItemOrders(item, orders)
                    resolve(item_embed)
                }
                catch (err) {
                    console.error(err)
                    resolve({
                        title: item.item_name,
                        description: `Error occured: ${err?.response?.data?.message || err?.message}`
                    })
                }
            })
        }
    } catch (err) {
        console.error(err)
        message.channel.send(`Error occured: ${err?.response?.data?.message || err?.message || JSON.stringify(err)}`).catch(console.error)
    }
}

function testCommand(message){
    message.channel.send({
        content: 'Hello there <:eee:1256334253470388308>',
        embeds: [{
            title: 'Gauss Prime Set',
            description: 'Warframe',
            thumbnail: {url:"https://warframe.market/static/assets/items/images/en/thumbs/gauss_prime_set.df5aa569d863730a4de767fd449c107e.128x128.png"}
        },{
            title: 'Gauss Prime Neuroptics',
            description: 'Warframe',
            thumbnail: {url:"https://warframe.market/static/assets/sub_icons/warframe/prime_helmet_128x128.png"}
        }]
    })
}

async function ordersUpdate(reaction,user){
    try{
        const item_embeds = reaction.message.embeds
        const item_titles = item_embeds.map(item => item.data.title)
        console.log(item_titles)
        const items = (await Promise.allSettled(item_titles.map(item => getItemByTitle(item)))).map(el => el.value)
        console.log(items)

        var response_embed = item_embeds.map((item) => {
            item.data.title = item.data.title + ' (Updating...)'
            return item
        })
        reaction.message.edit({embeds: response_embed}).catch(console.error)
        response_embed = (await Promise.allSettled(items.map((item) => getResponseEmbed(item)))).map(el => el.value)
        reaction.message.edit({ content: 'React with :up: to update', embeds: response_embed }).catch(console.error)

        reaction.users.remove(user).catch(console.error)
        console.log("user reaction removed")

        async function getResponseEmbed(item) {
            return new Promise(async (resolve, reject) => {
                try {
                    // const orders = await axios.get('https://api.warframe.market/v1/items/'+item.url_name+'/orders').then(r => r.data.payload.orders)
                    // const orders_ordered = orders.sort((a, b) => (a.platinum > b.platinum ? 1 : -1))
                    const orders = await getItemOrders(item)
                    const item_embed = wfmItemOrders(item, orders)
                    resolve(item_embed)
                }
                catch (err) {
                    console.error(err)
                    resolve({
                        title: item.item_name,
                        description: `Error occured: ${err?.response?.data?.message || err?.message}`
                    })
                }
            })
        }
    }catch(err){
        console.error(err)
        message.channel.send(`Error occured: ${err?.response?.data?.message || err?.message || JSON.stringify(err)}`).catch(console.error)
    }   
}


module.exports = {
    ordersCommand,ordersUpdate,testCommand
}
