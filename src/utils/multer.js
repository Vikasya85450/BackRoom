

import multer from "multer";


const storage = multer.memoryStorage();

export const uploadFile =multer({ storage}) ; 
// .single('file');
export default uploadFile;