import { UserOutlined, UserSwitchOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  DatePicker,
  Form,
  FormInstance,
  Input,
  message,
  Radio,
  Segmented,
  Space,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import dayjs from 'dayjs';
import axiosInstance from '../../api/axiosConfig';
import AvatarUpload from '../../components/AvatarUpload/AvatarUpload';

interface SubmitButtonProps {
  form: FormInstance;
}

export const Profile = () => {
  const { user, refreshUser } = useUser();

  const [form] = Form.useForm();
  const [form2] = Form.useForm();

  const [optionSetting, setOptionSetting] = useState('info');

  const SubmitButton: React.FC<React.PropsWithChildren<SubmitButtonProps>> = ({
    form,
    children,
  }) => {
    const [submittable, setSubmittable] = React.useState<boolean>(false);

    // Watch all values
    const values = Form.useWatch([], form);

    React.useEffect(() => {
      form
        .validateFields({ validateOnly: true })
        .then(() => setSubmittable(true))
        .catch(() => setSubmittable(false));
    }, [form, values]);

    return (
      <Button type="primary" htmlType="submit" disabled={!submittable}>
        {children}
      </Button>
    );
  };

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        phonenumber: user.phone,
        address: user.address,
        gender: user.gender,
        birthday: user.dob ? dayjs(user.dob) : null,
      });
    }
  }, [user, form]);

  const handleUpdateInfoUser = async (values) => {
    try {
      const res = await axiosInstance.put('/api/user/user', {
        name: values.name,
        phone: values.phonenumber,
        address: values.address,
        gender: values.gender,
        dob: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
      });

      if (res.status === 200) {
        message.success('Cập nhật thông tin thành công!');
        refreshUser();
      }
    } catch (error) {
      message.error(error.response.data.error);
    }
  };

  const handleChangePassword = async (values) => {
    try {
      const res = await axiosInstance.put('/api/user/change-password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      if (res.status === 200) {
        message.success('Cập nhật mật khẩu thành công!');
      }
    } catch (error) {
      message.error(error.response.data.error);
    }
  };
  return (
    <div className="p-[32px] flex flex-col w-full h-full gap-[18px]">
      <div className="text-[22px] font-medium">Thông tin tài khoản</div>
      <div className="w-full h-full flex gap-[20px]">
        <div className="w-[370px] min-w-[370px] h-fit bg-white rounded-lg shadow-lg flex flex-col overflow-hidden gap-[42px] p-[18px]">
          <div className="flex flex-col items-center gap-[16px] w-full">
            {/* <Avatar src={user?.avatar} size={100} icon={<UserOutlined />} /> */}
            <AvatarUpload
              avatarUrl={user?.avatar}
              userId={user?.id}
              refresh={refreshUser}
            />
            <div className="text-[18px] font-medium"> {user?.name} </div>

            {/* <Button>Dổi ảnh đại diện</Button> */}
          </div>

          <div className="flex flex-col gap-[24px]">
            <div className="flex gap-[10xp]">
              <div className="text-[16px] text-start w-[120px] text-gray-500">
                Mã
              </div>
              <div className="text-[16px] text-start font-semibold">
                {user?.id}
              </div>
            </div>

            <div className="flex gap-[10xp]">
              <div className="text-[16px] text-start w-[120px] text-gray-500">
                Email
              </div>
              <div className="text-[16px] text-start font-semibold">
                {user?.email}
              </div>
            </div>

            <div className="flex gap-[10xp]">
              <div className="text-[16px] text-start w-[120px] text-gray-500">
                Số điện thoại
              </div>
              <div className="text-[16px] text-start font-semibold">
                {user?.phone ? user?.phone : 'Chưa có'}
              </div>
            </div>

            <div className="flex gap-[10xp]">
              <div className="text-[16px] text-start w-[120px] text-gray-500">
                Loại tài khoản
              </div>
              <div className="text-[16px] text-start font-semibold">
                {user?.role === 'user' ? 'Người dùng' : 'Quản lý'}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full h-full bg-white rounded-lg shadow-lg flex flex-col overflow-hidden p-[18px] items-center gap-[32px]">
          <Segmented
            size="large"
            options={[
              { label: 'Thông tin', value: 'info', icon: <UserOutlined /> },
              {
                label: 'Bảo mật',
                value: 'auth',
                icon: <UserSwitchOutlined />,
              },
            ]}
            value={optionSetting}
            onChange={(e) => {
              setOptionSetting(e);
            }}
          />

          {optionSetting === 'info' ? (
            <Form
              form={form}
              name="validateOnly"
              layout="vertical"
              autoComplete="off"
              className="w-full"
              onFinish={handleUpdateInfoUser}
            >
              <Form.Item
                name="name"
                label="Họ và Tên"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="phonenumber"
                label="Số điện thoại"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="address"
                label="Điạ chỉ"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="gender"
                label="Giới tính"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Radio value="Nam"> Nam </Radio>
                  <Radio value="Nữ"> Nữ </Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="birthday"
                label="Ngày sinh"
                rules={[{ required: true }]}
              >
                <DatePicker />
              </Form.Item>
              <Form.Item>
                <Space className="w-full flex items-center">
                  <SubmitButton form={form}>Cập nhật thông tin</SubmitButton>
                  <Button htmlType="reset">Quay lại</Button>
                </Space>
              </Form.Item>
            </Form>
          ) : (
            <div className="w-full h-fit flex flex-col border-[1px] border-purple-500 rounded-lg overflow-hidden">
              <div className="w-full bg-purple-100 p-[10px]">
                <div>Đổi mật khẩu</div>
              </div>
              <div className="w-full h-full p-[12px]">
                <Form
                  form={form2}
                  name="validateOnly"
                  layout="vertical"
                  autoComplete="off"
                  className="w-full"
                  onFinish={handleChangePassword}
                >
                  <Form.Item
                    name="oldPassword"
                    label="Mật khẩu hiện tại"
                    rules={[{ required: true }]}
                  >
                    <Input type="password" />
                  </Form.Item>
                  <Form.Item
                    name="newPassword"
                    label="Mật khẩu mới"
                    rules={[{ required: true }]}
                  >
                    <Input type="password" />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    label="Xác nhận mật khẩu mới"
                    rules={[{ required: true }]}
                  >
                    <Input type="password" />
                  </Form.Item>
                  <Form.Item>
                    <Space className="w-full flex items-center">
                      <SubmitButton form={form2}>Đổi mật khẩu</SubmitButton>
                    </Space>
                  </Form.Item>
                </Form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
