import { ActionName } from '../types'
import BaseAction from '../BaseAction'
import { NTQQMsgApi } from '@/ntqqapi/api/msg'
import { MessageUnique } from '@/common/utils/MessageUnique'

interface Payload {
  message_id: number | string
  emoji_id: number | string
}

export class SetMsgEmojiLike extends BaseAction<Payload, any> {
  actionName = ActionName.SetMsgEmojiLike

  protected async _handle(payload: Payload) {
    if (!payload.message_id) {
      throw Error('message_id不能为空')
    }
    const msg = await MessageUnique.getMsgIdAndPeerByShortId(+payload.message_id)
    if (!msg) {
      throw new Error('msg not found')
    }
    if (!payload.emoji_id) {
      throw new Error('emojiId not found')
    }
    const msgData = (await NTQQMsgApi.getMsgsByMsgId(msg.Peer, [msg.MsgId])).msgList
    if (!msgData || msgData.length == 0 || !msgData[0].msgSeq) {
      throw new Error('find msg by msgid error')
    }
    return await NTQQMsgApi.setEmojiLike(
      msg.Peer,
      msgData[0].msgSeq,
      payload.emoji_id.toString(),
      true
    )
  }
}
