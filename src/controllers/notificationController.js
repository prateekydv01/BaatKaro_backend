import { Notification }
from "../models/notificationModel.js";

export const getNotifications =async (req, res) => {

   try {

      const notifications = await Notification.find({
            receiverId:
               req.user._id

         })

         .populate(
            "senderId",
            "username profilePic"
         )

         .sort({
            createdAt: -1
         });

      return res.status(200).json({
         notifications
      });

   } catch (error) {

      return res.status(500).json({
         message: error.message
      });
   }
};

export const markAsRead =async (req, res) => {

   try {

      const { id } = req.params;

      await Notification
      .findByIdAndUpdate(
         id,
         {
            isRead: true
         }
      );

      return res.status(200).json({
         message: "read"
      });

   } catch (error) {

      return res.status(500).json({
         message: error.message
      });
   }
};

export const deleteNotification =async (req,res)=>{

   try{

      const { id } = req.params;

      await Notification.findByIdAndDelete(
         id
      );

      return res.status(200).json({
         message:"Notification deleted"
      });

   }catch(error){

      return res.status(500).json({
         message:error.message
      });

   }

};