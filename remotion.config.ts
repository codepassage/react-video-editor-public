import { Config } from '@remotion/cli/config';
import path from 'path';

console.log('🎬 Remotion 설정 로드 - 폰트 지원 추가');

// 출력 디렉토리 설정
Config.setOutputLocation('server/renders');

// 번들 캐시 설정
Config.setCachingEnabled(true);


// 🎨 폰트 지원을 위한 Webpack 설정 추가
Config.overrideWebpackConfig((currentConfiguration) => {
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...currentConfiguration.resolve?.alias,
        // public/font 디렉토리를 직접 참조할 수 있도록 설정
        '@fonts': path.resolve(__dirname, 'public/font'),
      },
    },
    module: {
      ...currentConfiguration.module,
      rules: [
        ...(currentConfiguration.module?.rules || []),
        // 폰트 파일 처리 규칙 추가
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name][ext]',
          },
        },
      ],
    },
  };
});

// 🎨 정적 자산 경로 설정 (폰트 지원)
Config.setPublicDir(path.resolve(__dirname, 'public'));

export default Config;
