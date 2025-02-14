import { EyeInvisibleOutlined } from '@ant-design/icons';

export const AccessDenied = () => {
  return (
    <div className="p-[32px] flex flex-col w-full h-full gap-[18px]">
      <div className="w-full h-full bg-white rounded-lg shadow-lg flex flex-col items-center justify-center p-[20px] overflow-auto gap-[18px]">
        <div className="flex flex-col items-center gap-[32px]">
          <EyeInvisibleOutlined
            className="text-purple-950"
            style={{ fontSize: '150px' }}
          />

          <div className="flex flex-col items-center">
            <div className="text-[32px]">Trang không thể truy cập</div>
          </div>
        </div>
      </div>
    </div>
  );
};
