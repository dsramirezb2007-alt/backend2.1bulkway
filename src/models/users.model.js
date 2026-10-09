import mongoose from "mongoose";

//1 definir mi estructura de datos de mi Documento

const UserSchema = new mongoose.Schema ({
    name: {
        type: String,          // tipo de dato
        require:true   ,           // regla 
        trim: true                        //modificador
    },
   email: { 
    type :String ,
    required :true 

    },
    password:{
        type: String ,
        trim :true ,
        require : true 

    },
   
},{
    timestamps :true  // crea automaticamente la fecha y hora de registro de caundo se creo
    //  la cuenda
});
//2 }Definir el modelo . Dicho modelo Esta atado al nombnre del documento 
const UserModel = mongoose.model();
export default UserModel;