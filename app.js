//============================================================
//S: barcode

Capture_barcode_Opts= { //DFLT
        preferFrontCamera : false, // iOS and Android
        showFlipCameraButton : true, // iOS and Android
        showTorchButton : true, // iOS and Android
        torchOn: false, // Android, launch with the torch switched on (if available)
        saveHistory: true, // Android, save scan history (default false)
        prompt : "Place a barcode inside the scan area", // Android
        resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
        formats : "QR_CODE,PDF_417,EAN_13", // leyo DNI, qr wikipedia y codigo barras libro
        orientation : "portrait", // Android only (portrait|landscape), default unset so it rotates with the device
        disableAnimations : true, // iOS disable
        SuccessBeep: false // iOS and Android
      }

function capture_barcode_p(opts) {
        //SEE: https://www.npmjs.com/package/cordova-plugin-qr-barcode-scanner
        opts= opts || Capture_barcode_Opts;
        return new Promise( (onBarCodeOk, onBarCodeError) =>
                cordova.plugins.barcodeScanner.scan( onBarCodeOk, onBarCodeError, opts));
      }



function _init() {
  btnSts= document.getElementById("status");
  btnScan= document.getElementById("scan");

  btnSts.innerHTML= "Listo!";
  btnScan.onclick= function (ev) {
    btnSts.innerHTML= "Leyendo";
    capture_barcode_p()
      .then( codigo => { 
        var id= codigo.text;
        //https://world.openfoodfacts.org/api/v0/product/[barcode].json API de openfoodfacts
        var url= 'https://world.openfoodfacts.org/api/v0/product/'+id+'.json'
        fetch(url)
          .then(response => response.json())
          .then(data => paintFrontEnd(data,id))
      });
  }
}

document.addEventListener("deviceready", _init, false);

function paintFrontEnd(data,id){
  barInfo= document.getElementById('bar-info');
  info= document.getElementById('info');
  var img= document.getElementById('img');
  if(data.status){
    btnSts.textContent= data.product.product_name;
    barInfo.textContent= "El codigo es: " + data.code;
    
    if(data.product.image_front_thumb_url.length>0){
      img.src= data.product.image_front_thumb_url; 
    }
    mostrarOctogonos(data.product.nutriments);
  }
  else{
    btnSts.textContent= "";
    barInfo.textContent= "El codigo " + id + " no figura en nuestra base";
    img.src= "";
  }
}


//EMULAR LECTURAS EN LA PC
emularLecturas= [
  {text: "7790040929906"}, //chocolinas, todos los datos
  {text: "7791058010662"}, //dulce de leche mafrey, todos los datos
  {text: "7622210812797"}, //juguito, no hay nutrientes. Lo mandas a openfoodfacts a rellenar?
  {text: "7622210852797"}, //no existe el producto. Lo mandas a openfoodfacts a agregar?
];
emularLecturasIdx= -1;
function emularCordova() {
  //se redefine la funcion que es utilizada en _init()
  capture_barcode_p= function () { 
    emularLecturasIdx= (emularLecturasIdx + 1) % emularLecturas.length;
    return Promise.resolve(emularLecturas[ emularLecturasIdx ]); 
  }
  _init();
}

function mostrarOctogonos(nutriments){
  console.log(nutriments);
  if(excesoAzucar(nutriments)){
    document.getElementsById('azucar').style.visibility= 'visible';
  }
  if(excesoSodio(nutriments)){
    document.getElementsById('sodio').style.visibility= 'visible';
  }
  if(excesoGrasas(nutriments)){
    document.getElementById('grasas').style.visibility= 'visible';
  }
  if(excesoGrasasSat(nutriments)){
    document.getElementById('grasas-sat').style.visibility= 'visible';
  }
  if(excesoCalorias(nutriments)){
    document.getElementById('calorias').style.visibility= 'visible';
  }
  if(contieneEdulcorantes(nutriments)){
    document.getElementById('edulcorante').style.visibility= 'visible';
  }
  if(contieneCafeina(nutriments)){
    document.getElementById('cafeina').style.visibility= 'visible';
  }
}

//CRITERIOS USADOS EN EL MODELO DE PERFIL DE NUTRIENTES DE LA OPS
//LINK AL MODELO:
// https://iris.paho.org/bitstream/handle/10665.2/18622/9789275318737_spa.pdf
function excesoAzucar(nutriments){
  
}
function excesoSodio(nutriments){

}
function excesoGrasas(nutriments){

}
function excesoGrasasSat(nutriments){

}
function excesoCalorias(nutriments){

}
function contieneEdulcorantes(nutriments){
  
}
function contieneCafeina(nutriments){
  
}

