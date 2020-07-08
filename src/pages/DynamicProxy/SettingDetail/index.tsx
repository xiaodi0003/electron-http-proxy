import { Form, Modal, Input, Select, Radio } from 'antd';
import React, { useState } from 'react';
import { ProxySetting } from '@/models/connect';
import './index.less';

const Option = Select.Option;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

const removeProtocol = (url: string) => url.replace(/^.*?:\/\//, '');
const getProtocol = (url: string) => url.replace(/(.*?):.*/, '$1');
const hasProtocol = (url: string) => ['http', 'https', 'file'].includes(getProtocol(url))

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 12 },
};

const SettingDetail: React.FC<{setting: ProxySetting; onOk: any}> = ({
  setting,
  onOk
}) => {
  const [nowSetting, setNowSetting] = useState(setting);
  nowSetting.type = nowSetting.type || 'exact';
  nowSetting.from = nowSetting.from || 'http://';
  nowSetting.to = nowSetting.to || 'http://';

  const {type, from, to} = nowSetting;
  const [form] = Form.useForm();

  const setSetting = (s: object) => setNowSetting({...nowSetting, ...s});

  const selectFromProtocol = (
    <Select value={getProtocol(from)} style={{ width: 90 }} onChange={v => setSetting({from: `${v}://${removeProtocol(from)}`})}>
      <Option value="http">http://</Option>
      <Option value="https">https://</Option>
    </Select>
  );

  const selectToProtocol = (
    <Select value={getProtocol(to)} style={{ width: 90 }} onChange={v => setSetting({to: `${v}://${removeProtocol(to)}`})}>
      <Option value="http">http://</Option>
      <Option value="https">https://</Option>
      <Option value="file">file://</Option>
    </Select>
  );

  function setFromToForm(value: string, field: string, oldValue: string) {
    let url = value.trim();
    if (hasProtocol(url)) {
      setSetting({[field]: url});
      url = removeProtocol(value.trim());
      form.setFieldsValue({[field]: url});
    } else {
      form.setFieldsValue({[field]: url});
      setSetting({[field]: `${getProtocol(oldValue)}://${url}`});
    }
  }

  function onFinish() {
    onOk(nowSetting);
  }

  return (
    <Modal
      className='proxySettingDetail'
      title={setting.id ? 'Edit' : 'Add'}
      visible
      onOk={() => form.submit()}
      onCancel={() => onOk()}
    >
      <Form {...formItemLayout} form={form} onFinish={onFinish}>
        <FormItem
          label='配置类型'
          name='type'
          rules={[{
            required: true,
            message: '必选'
          }]}
          initialValue={type}
        >
          <RadioGroup onChange={({target: {value}}) => {
            form.setFieldsValue({type: value});
            setSetting({type: value});
          }}>
            <Radio value={'exact'}>Exact</Radio>
            <Radio value={'prefix'}>Prefix</Radio>
            <Radio value={'regex'}>Regex</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem
          label='匹配条件'
          name='from'
          rules={[{
            required: true,
            message: '必填'
          }]}
          initialValue={removeProtocol(from)}
        >
          <Input
            addonBefore={selectFromProtocol}
            addonAfter={'Test'}
            onChange={({target: {value}}) => setFromToForm(value, 'from', from)}
          />
        </FormItem>
        <FormItem
          label='代理目标'
          name='to'
          rules={[{
            required: true,
            message: '必填'
          }]}
          initialValue={removeProtocol(to)}
        >
          <Input
            addonBefore={selectToProtocol}
            onChange={({target: {value}}) => setFromToForm(value, 'to', to)}
          />
        </FormItem>
      </Form>
    </Modal>
  );
};

export default SettingDetail;
