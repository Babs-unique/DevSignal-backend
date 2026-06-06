import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';


export const extractResume = async (buffer: Buffer , mimeType: string) => {
    if(mimeType === 'application/pdf'){
        const parsed = await new PDFParse(buffer);
        return parsed.getText;
    }else if(mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
        const result = await mammoth.extractRawText({buffer});
        return result.value;
    }
}
