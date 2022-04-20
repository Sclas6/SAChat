import imp
import json
#from channels.generic.websocket import WebsocketConsumer
from channels.generic.websocket import AsyncWebsocketConsumer
import datetime

#from asgiref.sync import async_to_sync

class ChatConsumer(AsyncWebsocketConsumer):

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.strGroupName=''
        self.strUserName=''

    async def connect(self):
        #self.strGroupName='chat'
        #await self.channel_layer.group_add(self.strGroupName,self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.leave_chat()
        
    async def receive(self, text_data):
        text_data_json=json.loads(text_data)
        if('join'==text_data_json.get('data_type')):
            self.strUserName=text_data_json['username']
            strRoomName=text_data_json['roomname']
            await self.join_chat(strRoomName)
        elif('leave'==text_data_json.get('data_type')):
            await self.leave_chat()
        else:
            strMessage=text_data_json['message']
            data={
                'type':'chat_message',
                'message':strMessage,
                'username':self.strUserName,
                'datetime': datetime.datetime.now().strftime('%Y/%m/%d %H:%M:&S'),
            }
            await self.channel_layer.group_send(self.strGroupName,data)

    async def chat_message(self,data):
        data_json={
            'message':data['message'],
            'username':data['username'],
            'datetime':data['datetime'],
        }
        await self.send(text_data=json.dumps(data_json))

    async def join_chat(self,strRoomName):
        #self.strGroupName='chat'
        self.strGroupName='chat_%s'% strRoomName
        await self.channel_layer.group_add(self.strGroupName,self.channel_name)

    async def leave_chat(self):
        if(''==self.strGroupName):
            return
        await self.channel_layer.group_discard(self.strGroupName,self.channel_name)
        self.strGroupName=''