
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
    limpiarOctogonos();
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

//DIBUJAR FRONT DESPUES DE ESCANEAR EL PRODUCTO
function paintFrontEnd(data,id){
  barInfo= document.getElementById('bar-info');
  info= document.getElementById('info');
  var img= document.getElementById('img');
  if(data.status){
    btnSts.textContent= data.product.product_name;
    barInfo.textContent= data.code;
    
    //colocar imagen thumb del procuto
    if(data.product.image_front_thumb_url.length>0){
      img.src= data.product.image_front_thumb_url; 
    }

    
    console.log(data.product);
    mostrarOctogonos(data.product);
  }
  else{
    btnSts.textContent= "";
    barInfo.textContent= "El codigo " + id + " no figura en nuestra base";
    img.src= "";
  }
}


//EMULAR LECTURAS EN LA PC
emularLecturas= [
  {text: "7795735000335"},
  {text: "7794940000796"},
  {text: "7790040929906"}, //chocolinas, todos los datos
  {text: "7794520868341"}, //papitas
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


//OCTOGONOS
function mostrarOctogonos(product){
  

  //warning si no hay datos
  if(!('sodium' in product.nutriments && 'sugars' in product.nutriments && 'fat' in product.nutriments)){
      document.getElementById('faltanNutrientes').style.display= 'flex';
  }

  if(excesoAzucar(product.nutriments)){
    document.getElementById('azucar').style.display= 'flex';
  }
  if(excesoSodio(product.nutriments)){
    document.getElementById('sodio').style.display= 'flex';
  }
  if(excesoGrasas(product.nutriments)){
    document.getElementById('grasas').style.display= 'flex';
  }
  if(excesoGrasasSat(product.nutriments)){
    document.getElementById('grasas-sat').style.display= 'flex';
  }
  if(excesoCalorias(product.nutriments)){
    document.getElementById('calorias').style.display= 'flex';
  }
  if(contieneEdulcorantes(product)){
    document.getElementById('edulcorante').style.display= 'flex';
  }
  if(contieneCafeina(product)){
    document.getElementById('cafeina').style.display= 'flex';
  }
}

function limpiarOctogonos(){
  var octogonos= document.getElementsByClassName('octogonos');
  Array.from(octogonos).forEach(function clean(octogono){
    octogono.style.display= 'none';
  });
  document.getElementById('faltanNutrientes').style.display= 'none';
}



//CRITERIOS USADOS EN EL MODELO DE PERFIL DE NUTRIENTES DE LA OPS
//LINK AL MODELO:
// https://iris.paho.org/bitstream/handle/10665.2/18622/9789275318737_spa.pdf
function excesoAzucar(nutriments){
  console.log(nutriments.sugars);
  if(nutriments['energy-kcal']===0){
    return false;
  }
  if(nutriments.sugars_unit === 'g' || nutriments.sugars_unit === ''){
    return nutriments.sugars * 4 >= (nutriments['energy-kcal']/100)*10;
  }
  if(nutriments.sugars_unit === 'mg'){
    return (nutriments.sugars/1000) * 4 >= (nutriments['energy-kcal']/100)*10;
  }
  return false;
}

function excesoSodio(nutriments){
  console.log(nutriments.sodium);
  if(nutriments['energy-kcal']===0){
    return false;
  }
  if(nutriments.sodium_unit === 'g'){
    return nutriments.sodium * 1000 >= nutriments['energy-kcal'];
  }
  if(nutriments.sodium_unit === 'mg'){
    return nutriments.sodium >= nutriments['energy-kcal'];
  }
  return false;
}

function excesoGrasas(nutriments){
  if(nutriments['energy-kcal']===0){
    return false;
  }
  return nutriments.fat * 9 >= (nutriments['energy-kcal']/100)*30;
}

function excesoGrasasSat(nutriments){
  if(nutriments['energy-kcal']===0){
    return false;
  }
  return nutriments['saturated-fat'] * 9 >= (nutriments['energy-kcal']/100)*10;
}

function excesoCalorias(nutriments){
  //no esta determinado por ahora
  return false;
}

function contieneEdulcorantes(product){
  if('ingredients_text' in product){
    if(product.ingredients_text.toLowerCase().includes('sacarina') 
    || product.ingredients_text.toLowerCase().includes('ciclamato')
    || product.ingredients_text.toLowerCase().includes('aspartame')
    || product.ingredients_text.toLowerCase().includes('acesulfame k')
    || product.ingredients_text.toLowerCase().includes('neohoesperidina')
    || product.ingredients_text.toLowerCase().includes('dihidrochalcona')
    || product.ingredients_text.toLowerCase().includes('sucralosa')
    || product.ingredients_text.toLowerCase().includes('glicósido de esteviol')
    ){
      return true;
    }
  }  
  return false;
}

function contieneCafeina(product){
  if('ingredients_text' in product){
    if(product.ingredients_text.toLowerCase().includes('cafe')){
      return true;
    }
  }
  return false;
}

