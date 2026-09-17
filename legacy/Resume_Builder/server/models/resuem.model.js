import mongoose from "mongoose";

//userid
//  title, public, templlate, accent_color,
//  proffesion_summary,skills is a array , 



//personal_infois a object with obhject iameg , full_name, 
// proffesion, email , phone , location,
//website 


const ResumeSchema= new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    title:{
        type:String,
        default:"Untitled-resume",
    },
        public:{
            type:Boolean,
            default:false
        },
        template:{
            type:String,
            default:"classic"
        },
        accent_color:{
            type:String,
            default:"#3B82F6"
        },
        proffession_summary:{
            type:String,
            default:""
        },
 
        skills:[{type:String}],

       personal_info:{
        image:{type:String,default:""},
        full_name:{type:String ,default:""},
        proffesion:{type:String ,default:""},
        email:{type:String ,default:""},
        phone:{type:String ,default:""},
        location:{type:String ,default:""},
        linkedin:{type:String ,default:""},
        website:{type:String ,default:""},
       },
       experience:[
        {
            company:{type:String},
            positon:{type:String},
            start_date:{type:String},
            end_date:{type:String},
            description:{type:String},
            is_current:{type:String},
        }
       ],
       projects:[
        {
            name:{type:String},
            type:{type:String}, 
            description:{type:String},
        }
       ],
       education:[
        {
             institution:{type:String},
            degree:{type:String},
            field:{type:String},
             gpa:{type:Number},
        }
       ],
        // title: { type: String, default: "Untitled-resume" },
  profile: { type: String, default: "" }, // new field
//   public: { type: Boolean, default: false },
},{timestamps:true,minimize:false});


const Resume= mongoose.model("Resume",ResumeSchema)

export default Resume;