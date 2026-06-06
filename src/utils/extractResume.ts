import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';


export const extractResume = async (buffer: Buffer , mimeType: string) => {
    if(mimeType === 'application/pdf'){
        const parsed = new PDFParse({ data: buffer });
        const result = await parsed.getText();
        return result.text;
    }else if(mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
        const result = await mammoth.extractRawText({buffer});
        return result.value;
    }

    return null;
}
