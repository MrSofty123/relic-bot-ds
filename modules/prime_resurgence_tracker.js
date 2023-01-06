const axios = require('axios');
const {client} = require('./discord_client.js');
const {convertUpper} = require('./extras.js');

const items_list = [{
    item_url: 'axi_l4_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'neo_v8_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'meso_o3_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'lith_o2_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'axi_g1_relic',
    max_price: 4,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'axi_n4_relic',
    max_price: 4,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'axi_s6_relic',
    max_price: 4,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'lith_n1_relic',
    max_price: 4,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'lith_v4_relic',
    max_price: 4,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'meso_k1_relic',
    max_price: 4,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'meso_s3_relic',
    max_price: 4,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'neo_z1_relic',
    max_price: 4,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'lith_n2_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'meso_n5_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'neo_n11_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'neo_n3_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'neo_n7_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'axi_n3_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'lith_n3_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'lith_t3_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'meso_n3_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'axi_n5_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'meso_f1_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
},{
    item_url: 'meso_o4_relic',
    max_price: 5,
    min_quantity: 3,
    type: 'sell'
}]

const mention_users = ['253525146923433984','407222185447391234']
const log_channel = '1060960447966232696'

var timeouts = []

setInterval(() => {
    //console.log('pr tracker invoked')
    items_list.forEach(tracker => {
        axios(`https://api.warframe.market/v1/items/${tracker.item_url}/orders`)
        .then(async response => {
            const orders = response.data.payload.orders
            orders.forEach(order => {
                if (order.user.status != "offline" && order.order_type == tracker.type && order.region == "en" && order.visible && order.platform == 'pc' && order.platinum <= tracker.max_price && order.quantity >= tracker.min_quantity) {
                    sendAlert(order, tracker.item_url)
                }
            })
        }).catch(console.error);
    })
}, 10000);

function sendAlert(order,item) {
    //console.log('sendAlert invoked')
    const key = `${order.user.ingame_name}${item}`
    if (timeouts.includes(key)) return
    const pasta = `/w ${order.user.ingame_name} Hi! Are you still ${order.order_type}ing [${convertUpper(item)}] for ${order.platinum}p each?`
    client.channels.cache.get(log_channel).send({
        content: mention_users.map(id => `<@${id}>`).join(', '),
        embeds: [{
            description: `User **${order.user.ingame_name}** (status: ${order.user.status}) is selling x${order.quantity} **${convertUpper(item)}** (${order.subtype}) for ${order.platinum}p each\n${pasta}\n(react with 👍 before you are going to pm)`
        }]
    }).then(msg => msg.react('👍').catch(console.error)).catch(console.error)
    timeouts.push(key)
    setTimeout(() => {
        timeouts = timeouts.filter(user => user !== key)
    }, 120000);
}