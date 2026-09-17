import {db} from "../libs/db.js"

export const createPlaylist= async (req,res) => {
 const {title, description}=req.body;
 const userID=req.user.id;
 try {
    const playlist=await db.playlist.create({
        data:{
            title, description,userID
        }

    })
     return res.status(200).json({
        message:"Playlist Created Successfully",
        playlist:playlist
     })

 } catch (error) {
     console.error(error);
     return res.status(400).json({
        message:"Failed to create playlist ",
        error:error.message
     })    
 }
    
}
export const addProblemInPlaylist = async (req, res) => {
  const {  playlistID } = req.params;
  const { problemIds: problemID } = req.body; // this is an ARRAY of strings
  const userID = req.user.id;

  // 🔍 DEBUG LOGS 
  console.log("problemID value:", problemID);//whole array 
  console.log("problemID isArray:", Array.isArray(problemID));//true
  console.log("type of problemID:", typeof problemID);//object
  console.log("type of first element:", typeof problemID?.[0]);//string

  try {
    if (!Array.isArray(problemID) || problemID.length === 0) {
      return res.status(400).json({
        message: "problemID should be a non-empty array",
      });
    }

    const userauth = await db.playlist.findFirst({
      where: {
        id: playlistID,
        userID: userID,
      },
    });

    if (!userauth) {
      return res.status(403).json({
        message: "No access given or no such playlist",
      });
    }

    // 🔑 BULK INSERT (correct way)
    const data = problemID.map((pid) => ({
       playlistID,
      problemID: pid,
    }));

    await db.problemsInPlaylist.createMany({
      data,
      skipDuplicates: true,   // avoids crashing on duplicates
    });

    return res.status(200).json({
      message: "Problems added successfully",
      addedProblems: problemID,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      message: "Failed to add problem",
      error: error.message,
    });
  }
};

export const getallproblemsfromPlaylist=async(req,res)=>{
      try {
        const userID=req.user.id;
        const playlists=await db.playlist.findMany({
            where:{
                userID 
            },
            include:{
                problems:{
                    include:{
                        problem:true
                    }
                }
            }
        });

        return res.status(200).json({
          message:"All details/problems Fetched Successfully",
          playlists
        })
      } catch (error) {
        console.error(error);
        return res.status(500).json({
            message:"Failed to get all details ",
            error:error.message
        })
      }
}

export const getplaylistdetailsByPlaylistID=async (req,res) => {
  try {
    const {playlistID}=req.params;
    const playlist=await db.playlist.findUnique({
        where:{
            id:playlistID
        }
    })
    return res.status(200).json({
        message:"Playlist Found", 
        playlist:playlist.title
    })
  } catch (error) {
     console.error(error);
        return res.status(500).json({
            message:"Failed to get all details ",
            error:error.message
        })
  }   
}

export const deletePlaylist= async (req,res) => {
    const {playlistID :id} =req.params;

    try {
        const playlist=await db.playlist.deleteMany({
            where:{
                id
            }
        })
        return res.status(200).json({
            message:"Playlist Deleted  Successfully",
            playlist
        })
    } catch (error) {
         console.error(error);
        return res.status(500).json({
            message:"Failed to get all details ",
            error:error.message
        })
    }
}
export const removeProblemFromPlaylist= async (req,res) => {
      const {playlistID} =req.params;
    const {problemID}=req.body;
    const userID=req.user.id;
    try {
         const userauth=await db.playlist.findUnique({
            where:{
               userID, id:playlistID
            }
        });
        if(!userauth){
            return res.status(403).json({
                message:"No access to delete problm form this playlist",
            })
        }
        const problem=await db.problemsInPlaylist.delete({
            where: {
    playlistID_problemID: {
      playlistID,
      problemID
    }
  }
        });
        return res.status(200).json({
            message:"Problem deleted",
            problemID:problemID.title
        })
    } catch (error) {
         console.error(error);
        return res.status(500).json({
            message:"Failed to delete problem from playlist",
            error:error.message
        })
    }
}
