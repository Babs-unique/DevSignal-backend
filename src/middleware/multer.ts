import multer from 'multer';
import path from 'path';
import { Request } from 'express';


const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        cb(null, '../uploads'); // Replace with your target folder path
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (
    req: Request, 
    file: Express.Multer.File, 
    cb: multer.FileFilterCallback
) => {
    const allowedExt = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tiff', '.svg', '.mp4', '.mov', '.avi', '.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExt.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file format')); 
    }
};

export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter 
});
