import { observable, action } from 'mobx-miniprogram'
import { Tim } from '../models/tim'
import TIM from 'tim-wx-sdk-ws'
import { setTabBarBadge } from '../utils/util'

export const timStore = observable({

    // 数据字段
    sdkReady: false,
    messageList: [],
    _targetUserId: null,
    intoView: 0,
    isCompleted: false,
    conversationList: [],

    // actions
    login: action(function () {
        this._runListener()
        Tim.getInstance().login()
    }),

    logout: action(function () {
        Tim.getInstance().logout()
    }),

    resetMessage: action(function () {
        this.messageList = []
        this._targetUserId = null
        this.intoView = 0
        this.isCompleted = false
    }),

    pushMessage: action(function (message) {
        this.messageList = this.messageList.concat([message])
        this.intoView = this.messageList.length - 1
    }),

    scrollMessageList: action(async function () {
        const messageList = await Tim.getInstance().getMessageList(this._targetUserId)
        this.intoView = messageList.length - 2
        this.isCompleted = Tim.getInstance().isCompleted
        this.messageList = messageList.concat(this.messageList.slice())
    }),

    getMessageList: action(async function () {
        if (!this._targetUserId) {
            throw Error('未指定目标用户 id')
        }

        this.messageList = await Tim.getInstance().reset().getMessageList(this._targetUserId)
        this.intoView = this.messageList.length - 1
        await Tim.getInstance().setMessageRead(this._targetUserId)
    }),

    getConversationList: action(async function () {
        this.conversationList = await Tim.getInstance().getConversationList()
    }),

    setTargetUserId: action(function (targetUserId) {
        this._targetUserId = targetUserId
    }),

    _runListener () {
        const sdk = Tim.getInstance().getSDK()
        sdk.on(TIM.EVENT.SDK_READY, this._handleSDKReady, this)
        sdk.on(TIM.EVENT.SDK_NOT_READY, this._handleSDKNotReady, this)
        sdk.on(TIM.EVENT.KICKED_OUT, this._handleSDKNotReady, this)
        sdk.on(TIM.EVENT.MESSAGE_RECEIVED, this._handleMessageReceived, this)
        sdk.on(TIM.EVENT.CONVERSATION_LIST_UPDATED, this._handleConversationList, this)
    },

    _handleSDKReady () {
        this.sdkReady = true
        const userInfo = User.getUserInfoByLocal()
        Tim.getInstance().updateUserProfile(userInfo)
    },

    _handleSDKNotReady () {
        this.sdkReady = false
    },

    async _handleMessageReceived (event) {
        if (!this._targetUserId) {
            return
        }
        console.info(event.data)
        const currentChatMessage = event.data.filter(item => item.from === this._targetUserId)

        if (currentChatMessage.length) {
            this.messageList = this.messageList.concat(currentChatMessage)
            this.intoView = this.messageList.length - 1
            await Tim.getInstance().setMessageRead(this._targetUserId)
        }
    },

    _handleConversationList (event) {
        if (!event.data.length) {
            return
        }
        this.conversationList = event.data
        const unreadCount = event.data.reduce((sum, item) => sum + item.unreadCount, 0)
        setTabBarBadge(unreadCount)
    },
})