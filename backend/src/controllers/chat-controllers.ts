import { NextFunction, Request, Response } from "express";
import User from "../models/User.js";
import  OpenAI from "openai"
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";


export const generateChatCompletion = async (req:Request, res: Response , next : NextFunction) => {
  const { message} = req.body;

  try {
  const user = await User.findById(res.locals.jwtData.id);
  if(!user) return res.status(401).json({message: "User not Register OR Token malfunctioned"})
  
       // grab chat of user
   const chats = user.chats.map(({role,content}) => ({role,content})) as ChatCompletionMessageParam[]
   chats.push({content: message,role : "user"})
    user.chats.push({content: message,role : "user"});
//send all chats with new one  new one to OpenAI API 
  
  const  openai = new OpenAI({
      apiKey: process.env.OPEN_AI_SECRET,
      organization: process.env.OPENAI_ORGANIZATION_ID,
  })
  const chatResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    store: true,
    messages: chats,

    });
    user.chats.push(chatResponse.choices[0].message)
    await user.save();
    return res.status(200).json({chats: user.chats})
    
  
       //get latest response 
    
      
  } catch (error ) {
      console.log(error);
      
   return res.status(500).json({message : "SomeThing Went Wrong"})
  }
}

export const sendChatsToUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //user token check
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
    }
    return res.status(200).json({ message: "OK", chats: user.chats });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ message: "ERROR", cause: error.message });
  }
};

export const deleteChats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //user token check
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
    }
    //@ts-ignore
    user.chats = [];
    await user.save();
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ message: "ERROR", cause: error.message });
  }
};
