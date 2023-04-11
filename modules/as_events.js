const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');
const { df_send_message } = require('./discord_functions.js');

const channel_ids = {
    moderator: '909247527201689680',
    event_submission: '1095422056813834291'
}

client.on('messageCreate',(message) => {
    if (message.guild?.id == '865904902941048862') {
        if (message.channel?.id == channel_ids.event_submission) {
            const screenshots = message.attachments.map(attachment => attachment.url).join('\n')
            df_send_message({
                embeds: [{
                    title: 'New Event Submission',
                    author: message.member,
                    description: `${message.content}${screenshots ? `\n\n**Attached Screenshots**\n${screenshots}` : ''}`,
                    color: '#7243c4'
                }]
            }, channel_ids.moderator).catch(console.error)
        }
    }
})