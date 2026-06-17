/**
 * Multer 파일 업로드 설정
 */

import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { appConfig } from './app.config.js';

/**
 * 파일 저장 설정
 */
export const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, appConfig.paths.uploads);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

/**
 * 파일 타입 필터
 */
export const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = [
    ...appConfig.mimeTypes.image,
    ...appConfig.mimeTypes.video,
    ...appConfig.mimeTypes.audio
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

/**
 * 업로드 제한 설정
 */
export const limits = {
  fileSize: appConfig.fileSize, // 1000MB
  files: appConfig.maxFiles,    // 10개
  fieldSize: appConfig.fileSize,
  fields: 10
};

/**
 * Multer 설정 객체
 */
export const multerConfig = {
  storage,
  fileFilter,
  limits
};

/**
 * 단일 파일 업로드 인스턴스
 */
export const uploadSingle = multer(multerConfig).single('file');

/**
 * 다중 파일 업로드 인스턴스
 */
export const uploadMultiple = multer(multerConfig).array('files', appConfig.maxFiles);

export default multerConfig;
