import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, Space, Upload } from 'antd';
import React from 'react';
import { useUser } from '../../context/UserContext';

export const Profile = () => {
  const { user } = useUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };
  const tailLayout = {
    wrapperCol: { offset: 4, span: 16 },
  };
  return (
    <div className="p-[32px] flex flex-col w-full h-full gap-[18px]">
      <div className="text-[22px] font-medium">Thông tin tài khoản</div>
      <div className="w-full h-full bg-white rounded-lg shadow-lg flex flex-col p-[32px] overflow-hidden">
        <Form
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 14 }}
          layout="horizontal"
          //   onValuesChange={onFormLayoutChange}
          size={'large'}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label="Avatar"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload action="/upload.do" listType="picture-card">
              <button style={{ border: 0, background: 'none' }} type="button">
                <UserOutlined style={{ fontSize: '42px' }} />
              </button>
            </Upload>
          </Form.Item>
          <Form.Item label="Mã">
            <Input disabled value={user?.name} />
          </Form.Item>
          <Form.Item label="Email">
            <Input disabled value={user?.email} />
          </Form.Item>

          <Form.Item {...tailLayout}>
            <Space>
              <Button className="w-[350px]" type="primary" htmlType="submit">
                Cập nhật thông tin
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};
