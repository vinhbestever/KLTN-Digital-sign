import { ContainerOutlined, SignatureOutlined } from '@ant-design/icons';
import { Steps } from 'antd';
import React from 'react';

export const Sign = () => {
  return (
    <div className="p-[32px] flex flex-col w-full h-full gap-[18px]">
      <div className="text-[22px] font-medium">Select file to Sign</div>
      <div className="w-full h-full flex gap-[12px] items-center justify-center">
        <div className="w-2/3 h-full bg-white rounded-lg shadow-lg flex flex-col items-center p-[12px]">
          <div className="w-[300px]">
            <Steps
              items={[
                {
                  title: 'Select file sign',
                  status: 'finish',
                  icon: <ContainerOutlined />,
                },
                {
                  title: 'Sign',
                  status: 'wait',
                  icon: <SignatureOutlined />,
                },
              ]}
            />
          </div>
        </div>
        <div className="w-1/3 h-full bg-white rounded-lg shadow-lg"></div>
      </div>
    </div>
  );
};
