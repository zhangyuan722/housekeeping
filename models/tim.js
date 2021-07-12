// 从v2.11.2起，SDK 支持了 WebSocket，推荐接入；v2.10.2及以下版本，使用 HTTP
import TIM from 'tim-wx-sdk-ws'
import TIMUploadPlugin from 'tim-upload-plugin'
import { timConfig } from '../config/tim'
const genTestUserSig = require('../lib/tim/generate-test-usersig')

class Tim {
    /**
     *
     * @type {Tim}
     */
    static instance = null
    _SDKInstance = null
    _nextRquMessageID = ''
    _messageList = []

    constructor () {
        // 创建 SDK 实例，`TIM.create()`方法对于同一个 `SDKAppID` 只会返回同一份实例
        let tim = TIM.create(timConfig.options) // SDK 实例通常用 tim 表示
        // 设置 SDK 日志输出级别，详细分级请参见 <a href="https://web.sdk.qcloud.com/im/doc/zh-cn//SDK.html#setLogLevel">setLogLevel 接口的说明</a>
        tim.setLogLevel(timConfig.logLevel) // 普通级别，日志量较多，接入时建议使用
        // tim.setLogLevel(1); // release 级别，SDK 输出关键信息，生产环境时建议使用
        // 注册腾讯云即时通信 IM 上传插件
        tim.registerPlugin({ 'tim-upload-plugin': TIMUploadPlugin })
        this._SDKInstance = tim
    }

    static getInstance () {
        if (!Tim.instance) {
            Tim.instance = new Tim()
        }
        return Tim.instance
    }

    getSDK () {
        return this._SDKInstance
    }

    login () {
        const userInfo = User.getUserInfoByLocal()
        const textUserSig = genTestUserSig(String(userInfo.id))
        this._SDKInstance.login({
            userID: String(userInfo.id),
            userSig: textUserSig.userSig
        })
    }

    async getMessageList (targetUserId, count = 10) {
        if (this._isCompleted) {
            return this._messageList
        }
        const res = this._SDKInstance.getMessageList({
            conversationID: `C2C${targetUserId}`,
            nextReqMessageID: this._nextRquMessageID,
            count: count > 15 ? 15 : count
        })

        this._nextRquMessageID = res.data.nextReqMessageID
        this._isCompleted = res.data.isCompleted
        this._messageList = res.data.messageList

        return this._messageList
    }

    _reset () {
        this._nextRquMessageID = ''
        this._isCompleted = false
        this._messageList = []
        return this
    }
}

export {
    Tim
}