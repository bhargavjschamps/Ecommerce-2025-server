import multer from 'multer'

const storage = multer.memoryStorage()

const uploadFiles = multer({storage}).array("images",10);

export default uploadFiles;