const config = require('../config')

function canReply ({ data, device }) {
    const { chat } = data
  
    //Skip if enviroment isn't development and the number isn't used to make tries
    if(process.env.NODE_ENV !='production'){
      if(!config.numbersDevelopmentEnv.length){
        console.log(`[warn] There isn't any number in config.numbersDevelopmentEnv seted and you're in development mode. The bot won't write any messages unless you setted the numbers the bot has to answer`)
        return false;
      }
      if(!config.numbersDevelopmentEnv.some(number=> number == data.fromNumber || number ==  data.fromNumber.slice(1))){
          console.log('[info] The number is not in the list of allowed numbers')
          return false
        }
    }

    // Skip if chat is already assigned to an team member
    if (chat.owner && chat.owner.agent) {
      return false
    }
  
    // Ignore messages from group chats
    if (chat.type !== 'chat') {
      return false
    }
  
    // Skip replying chat if it has one of the configured labels, when applicable
    if (config.skipChatWithLabels && config.skipChatWithLabels.length && chat.labels && chat.labels.length) {
      if (config.skipChatWithLabels.some(label => chat.labels.includes(label))) {
        return false
      }
    }
  
    // Only reply to chats that were whitelisted, when applicable
    if (config.numbersWhitelist && config.numbersWhitelist.length && chat.fromNumber) {
      if (config.numbersWhitelist.some(number => number === chat.fromNumber || chat.fromNumber.slice(1) === number)) {
        return true
      } else {
        return false
      }
    }
  
    // Skip replying to chats that were explicitly blacklisted, when applicable
    if (config.numbersBlacklist && config.numbersBlacklist.length && chat.fromNumber) {
      if (config.numbersBlacklist.some(number => number === chat.fromNumber || chat.fromNumber.slice(1) === number)) {
        return false
      }
    }
  
    // Skip replying chats that were archived, when applicable
    if (config.skipArchivedChats && (chat.status === 'archived' || chat.waStatus === 'archived')) {
      return false
    }
  
    // Always ignore replying to banned chats/contacts
    if ((chat.status === 'banned' || chat.waStatus === 'banned  ')) {
      return false
    }
  
    return true
  }

  module.exports = {canReply}