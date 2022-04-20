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
        self.speed=0
        self.direction=0

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
        elif('seek'==text_data_json.get('data_type')):
            self.speed=text_data_json['sa_speed']
            self.direction=text_data_json['sa_direction']
            data={
                'type':'sa_status',
                'username':self.strUserName,
                'datetime': datetime.datetime.now().strftime('%Y/%m/%d %H:%M:%S'),
                'sa_speed':self.speed,
                'sa_direction':self.direction,
            }
            await self.channel_layer.group_send(self.strGroupName,data)
        else:
            strMessage=text_data_json['message']
            self.speed=text_data_json['sa_speed']
            self.direction=text_data_json['sa_direction']
            data={
                'type':'chat_message',
                'message':strMessage,
                'username':self.strUserName,
                'datetime': datetime.datetime.now().strftime('%Y/%m/%d %H:%M:%S'),
                'sa_speed':self.speed,
                'sa_direction':self.direction,
            }
            await self.channel_layer.group_send(self.strGroupName,data)

    async def chat_message(self,data):
        data_json={
            'message':data['message'],
            'username':data['username'],
            'datetime':data['datetime'],
            'sa_speed':data['sa_speed'],
        }
        await self.send(text_data=json.dumps(data_json))

    async def sa_status(self,data):
        data_json={
            'username':data['username'],
            'datetime':data['datetime'],
            'sa_speed':data['sa_speed'],
            'sa_direction':data['sa_direction']
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