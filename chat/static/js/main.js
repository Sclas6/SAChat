/// <reference path="../../../web-bluetooth-typings/web-bluetooth.d.ts" />
  const SA_SERVICE_UUID = '40ee1111-63ec-4b7f-8ce7-712efd55b90e';
  const SA_CHARACTERISTIC_UUID = '40ee2222-63ec-4b7f-8ce7-712efd55b90e';

  const SA_DEVICE_ID_BYTE = {
    CycSA: 0x01,
    UFOSA: 0x02,
  };

  async function selectSa() {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: [SA_SERVICE_UUID] }
      ]
    });
    return device;
  }

  /**
   * @param {BluetoothDevice} device
   */
  async function connectSa(device) {
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SA_SERVICE_UUID);
    const characteristic = await service.getCharacteristic(SA_CHARACTERISTIC_UUID);
    return characteristic;
  }

  /** @type {Object<string, Promise<void>} */
  const lastPromise = {};
  /**
   * @param {BluetoothRemoteGATTCharacteristic} characteristic
   * @param {0|1} direction 0:clockwise, 1:counterclockwise
   * @param {Number} speed 0~100
   */
  async function setSpeedSa(characteristic, direction, speed) {
    const device = characteristic.service.device;
    const idByte = SA_DEVICE_ID_BYTE[device.name];
    const directionAndSpeed = (direction << 7) | speed;
    const value = new Uint8Array([idByte, 0x01, directionAndSpeed]);

    const prevPromise = lastPromise[device.id] || Promise.resolve();
    const currentPromise = (async () => {
      // await previous promise (ignore error)
      // because can't writeValue if already in progress
      await prevPromise.catch(() => { });

      if (lastPromise[device.id] !== currentPromise) {
        // skip to next promise
        return;
      }

      // write latest value
      await characteristic.writeValue(value);
    })();
    lastPromise[device.id] = currentPromise;
    await currentPromise;
  }

  /** @type {BluetoothRemoteGATTCharacteristic} */
  let characteristic;

  const deviceName = document.querySelector('#deviceName');
  const progress = document.querySelector('progress');
  /** @type {HTMLDivElement} */
  const controller = document.querySelector('#controller');

  /** @type {HTMLButtonElement} */
  const connectButton = document.querySelector('#connect');
  connectButton.addEventListener('click', async () => {
    try {
      const device = await selectSa();

      connectButton.style.display = 'none';
      deviceName.textContent = device.name;

      //progress.hidden = false;
      characteristic = await connectSa(device);

      //controller.hidden = false;

      device.addEventListener('gattserverdisconnected', onDisconnect);
    } catch (error) {
      console.error(error);
      alert(error.message);
      connectButton.style.display = 'block';
      deviceName.textContent = '';
    } finally {
      //progress.hidden = true;
    }
  });
  function onDisconnect() {
    alert('disconnected');
    connectButton.style.display = 'block';
    deviceName.textContent = '';
    //controller.hidden = true;
  }

  /** @type {HTMLInputElement} */
  const inputDirection = document.querySelector('#direction');
  inputDirection.addEventListener('input', onInputSpeed);

  /** @type {HTMLInputElement} */
  const inputSpeed = document.querySelector('#speed');
  inputSpeed.addEventListener('input', onInputSpeed,true);

  async function onInputSpeed() {
    const direction = inputDirection.checked ? 1 : 0;
    const speed = inputSpeed.valueAsNumber;
    await setSpeedSa(characteristic, direction, speed);
  }

  const g_elementDivJoinScreen = document.getElementById( "div_join_screen" );
  const g_elementDivChatScreen = document.getElementById( "div_chat_screen" );
  const g_elementInputUserName = document.getElementById( "input_username" );
  const g_elementInputRoomName = document.getElementById( "input_roomname" );
  const g_elementTextUserName = document.getElementById( "text_username" );
  //const g_elementTextRoomName = document.getElementById( "text_roomname" );
  const g_elementInputMessage = document.getElementById( "input_message" );
  //const g_elementInputSastatus = document.getElementById("input_message");
  const g_elementListMessage = document.getElementById( "list_message" );
  const room_name=document.getElementById("room_name");
  const speed_metor=document.getElementById("speed_metor");



  //UFO
  /*const SA_SERVICE_UUID='40ee1111-63ec-4b7f-8ce7-712efd55b90e';
  const SA_CHARACTERISTIC_UUID='40ee2222-63ec-4b7f-8ce7-712efd55b90e';
  const device=await navigator.bluetooth.requestDevice({
      filters:[
          {services:[SA_SERVICE_UUID]}
      ]
  });
  //const server=await device.gatt.connect();
  const service=await server.getPrimaryService(SA_SERVICE_UUID);
  const characteristic=await service.getCharacteristic(SA_CHARACTERISTIC_UUID);*/
  // WebSocketオブジェクト
  let ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
  const g_socket = new WebSocket( ws_scheme + "://" + window.location.host + "/ws/chat/" );
  // 「Join」ボタンを押すと呼ばれる関数
  function onsubmitButton_JoinChat()
  {
      // ユーザー名

      let strInputUserName = g_elementInputUserName.value;
      if( !strInputUserName )
      {
          return;
      }
      g_elementTextUserName.value = strInputUserName;
      //room name
      let strInputRoomName=g_elementInputRoomName.value;
      //g_elementTextRoomName.value=strInputRoomName;
      room_name.textContent=strInputRoomName;
      // サーバーに"join"を送信
      g_socket.send( JSON.stringify( { "data_type": "join", "username": strInputUserName,'roomname':strInputRoomName} ) );
      // 画面の切り替え
      g_elementDivJoinScreen.style.display = "none";  // 参加画面の非表示
      g_elementDivChatScreen.style.display = "block";  // チャット画面の表示
  }
  // 「Leave Chat.」ボタンを押すと呼ばれる関数
  function onclickButton_LeaveChat()
  {
      // メッセージリストのクリア
      while( g_elementListMessage.firstChild )
      {
          g_elementListMessage.removeChild( g_elementListMessage.firstChild );
      }
      // ユーザー名
      g_elementTextUserName.value = "";
      // サーバーに"leave"を送信
      g_socket.send( JSON.stringify( { "data_type": "leave" } ) );
      // 画面の切り替え
      g_elementDivChatScreen.style.display = "none";  // チャット画面の非表示
      g_elementDivJoinScreen.style.display = "flex";  // 参加画面の表示
  }
  // 「Send」ボタンを押したときの処理
  function onsubmitButton_Send()
  {
      // 送信用テキストHTML要素からメッセージ文字列の取得
      let strMessage = g_elementInputMessage.value;
      let speed=inputSpeed.value;
      let direction=(inputDirection.checked)?1:0;
      if( !strMessage )
      {
          return;
      }
      //let saStatus=g_elementInputSastatus.value;
      // WebSocketを通したメッセージの送信
      g_socket.send( JSON.stringify( { "message": strMessage ,"sa_speed":speed,"sa_direction":direction} ) );
      // 送信用テキストHTML要素の中身のクリア
      g_elementInputMessage.value = "";
  }
  async function onSeek_bar(){
      let speed=inputSpeed.value;
      let direction=(inputDirection.checked)?1:0;
      g_socket.send(JSON.stringify({"data_type":"seek","sa_speed":speed,"sa_direction":direction}));
      inputSpeed.value=speed;
      speed_metor.textContent=speed;
      inputDirection.checked=direction;
  }
/*
  async function sensor(){
    var sensor=document.getElementById("sensor");
    g_socket.send(JSON.stringify({ "message": "test" ,"sa_speed":speed,"sa_direction":direction}));
  }*/
  var sensor = document.getElementById( "sensor" );
  var imgbutton=document.getElementById("imgbutton");
  var pressed=false;
  
  window.onload=function(){
    sensor.addEventListener("mousemove",function(e){
      imgbutton.onmousedown=function(){
        pressed=true;
      }

      imgbutton.onmouseup=function(){
        pressed=false;
        inputSpeed.value=0;
        speed_metor.textContent=0;
        g_socket.send(JSON.stringify({"data_type":"seek","sa_speed":0,"sa_direction":direction}));
      }
      sensor.onmouseleave=function(){
        inputSpeed.value=0;
        speed_metor.textContent=0;
        g_socket.send(JSON.stringify({"data_type":"seek","sa_speed":0,"sa_direction":direction}));
      }
      var mX=e.clientX;
      var mY=e.clientY;
      const clientRect=this.getBoundingClientRect();
      var positionX=clientRect.left+window.pageXOffset;
      var posirionY=clientRect.top+window.pageYOffset;
      var x=mX-positionX-100;
      var y=mY-posirionY-100;
      const r = 10000-((x**2)+(y**2));
      const par_speed=r<1000?0.1:r<2000?0.15:r<3000?0.2:r<4000?0.25:r<5000?0.3:r<6000?0.35:r<7000?0.4:r<8000?0.5:r<9700?0.6:1;
      let speed=0;
      let direction=(inputDirection.checked)?1:0;

      if(pressed==true&&x**2+y**2<100**2){
        speed=100*par_speed
      }else{
        speed=0;
      }
      g_socket.send(JSON.stringify({"data_type":"seek","sa_speed":speed,"sa_direction":direction}));
      inputSpeed.value=speed;
      speed_metor.textContent=speed;
      inputDirection.checked=direction;
    });

    imgbutton.addEventListener("touchmove",function(e){
      pressed=true;
      var mX=e.touches[0].clientX;
      var mY=e.touches[0].clientY;
      //sensor.value=mX;
      //sensor.value=mY;
      const clientRect=sensor.getBoundingClientRect();
      var positionX=clientRect.left+window.pageXOffset;
      var posirionY=clientRect.top+window.pageYOffset;
      var x=mX-positionX-100;
      var y=mY-posirionY-100;
      const r = 10000-((x**2)+(y**2));
      const par_speed=r<1000?0.1:r<2000?0.15:r<3000?0.2:r<4000?0.25:r<5000?0.3:r<6000?0.35:r<7000?0.4:r<8000?0.5:r<9700?0.6:1;
      let speed=100*par_speed;
      let direction=(inputDirection.checked)?1:0;
      if(pressed==true&&x**2+y**2<100**2){
        speed=100*par_speed
      }else{
        speed=0;
      }
      g_socket.send(JSON.stringify({"data_type":"seek","sa_speed":speed,"sa_direction":direction}));
      inputSpeed.value=speed;
      speed_metor.textContent=speed;
      inputDirection.checked=direction;
    },{passive:true});

    imgbutton.addEventListener("touchend", () => {
      let direction=(inputDirection.checked)?1:0;
      g_socket.send(JSON.stringify({"data_type":"seek","sa_speed":0,"sa_direction":direction}));
      inputSpeed.value=0;
      speed_metor.textContent=0;
    });

    sensor.addEventListener("pointerdown",function(e){
      var mX=e.clientX;
      var mY=e.clientY;
      const clientRect=this.getBoundingClientRect();
      var positionX=clientRect.left+window.pageXOffset;
      var posirionY=clientRect.top+window.pageYOffset;
      var x=mX-positionX-100;
      var y=mY-posirionY-100;
      const r = 10000-((x**2)+(y**2));
      const par_speed=r<1000?0.1:r<2000?0.15:r<3000?0.2:r<4000?0.25:r<5000?0.3:r<6000?0.35:r<7000?0.4:r<8000?0.5:r<9700?0.6:1;
      let speed=0;
      let direction=(inputDirection.checked)?1:0;
      if(x**2+y**2<100**2){
        speed=100*par_speed
      }else{
        speed=0;
      }
      g_socket.send(JSON.stringify({"data_type":"seek","sa_speed":speed,"sa_direction":direction}));
      inputSpeed.value=speed;
      speed_metor.textContent=speed;
      inputDirection.checked=direction;
    });
  }


  async function update_html(d){
    inputSpeed.value=d['sa_speed'];
    inputDirection.checked=(d['sa_direction']==0)?false:true;
    speed_metor.textContent=d['sa_speed'];
  }

  // WebSocketからメッセージ受信時の処理
  g_socket.onmessage = ( event ) =>
  {
      // 自身がまだ参加していないときは、無視。
      if( !g_elementInputUserName.value )
      {
          return;
      }
      // テキストデータをJSONデータにデコード
      let data = JSON.parse( event.data );
      // メッセージの整形
      //let strMessage = data["message"];
      let strMessage;
      if(typeof data["message"] === 'undefined'){
      }else{
        strMessage = data["datetime"] + " - [" + data["username"] + "] " + data["message"];
        let elementLi = document.createElement( "li" );
        elementLi.textContent = strMessage;
        g_elementListMessage.prepend( elementLi );
      }

      if(g_elementInputUserName.value!=data["username"]){
        if(data["username"]!="!leave!"){
          g_elementTextUserName.value=g_elementInputUserName.value+", "+data["username"];
        }else{
          g_elementTextUserName.value=g_elementInputUserName.value;
        }
        update_html(data);
      }
      //inputDirection.value=1;
      onInputSpeed();
      
  
  };
  // WebSocketクローズ時の処理
  g_socket.onclose = ( event ) =>
  {
      // ウェブページを閉じたとき以外のWebSocketクローズは想定外
      console.error( "Unexpected : Chat socket closed." );
  };

