import { Form, Modal, Input, Select, Radio, Switch } from 'antd';
import React, { useState } from 'react';
import AceEditor from "react-ace";
import { ProxySetting } from '@/models/connect';
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-github";
import './index.less';

const {Option} = Select;
const { TextArea } = Input;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

const removeProtocol = (url: string) => url.replace(/^.*?:\/\//, '');
const getProtocol = (url: string) => url.replace(/(.*?):.*/, '$1');
const hasProtocol = (url: string) => ['http', 'https', 'file'].includes(getProtocol(url))

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 12 },
};

const getInitChangeCode = () => `// 按需修改url、headers、body，可以返回具体的值，也可以返回一个Promise
async function reqHook({url, headers, body}) {
  return {url, headers, body};
}`;

const SettingDetail: React.FC<{setting: ProxySetting; onOk: any}> = ({
  setting,
  onOk
}) => {
  const [nowSetting, setNowSetting] = useState(setting);
  nowSetting.type = nowSetting.type || 'exact';
  nowSetting.from = nowSetting.from || 'http://';
  nowSetting.to = nowSetting.to || 'http://';
  nowSetting.enabled = nowSetting.enabled !== false;
  nowSetting.reqChange = nowSetting.reqChange || false;
  nowSetting.reqChangeCode = nowSetting.reqChangeCode || getInitChangeCode();

  const {type, from, to, enabled, reqChange, reqChangeCode} = nowSetting;
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

  const onFinish = () => onOk(nowSetting);

  const renderAce = (codeKey: string) => (<AceEditor
    mode='javascript'
    theme='github'
    height='300px'
    width='800px'
    tabSize={2}
    onChange={(value) => {
      form.setFieldsValue({[codeKey]: value});
      setSetting({[codeKey]: value});
    }}
    editorProps={{ $blockScrolling: true }}
  />);

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
          label='启用'
          name='enabled'
          valuePropName='checked'
          initialValue={enabled}
        >
          <Switch onChange={checked => {
            form.setFieldsValue({enabled: checked});
            setSetting({enabled: checked});
          }} />
        </FormItem>
        <FormItem
          label='配置类型'
          name='type'
          initialValue={type}
        >
          <RadioGroup onChange={({target: {value}}) => {
            form.setFieldsValue({type: value});
            setSetting({type: value});
          }}>
            <Radio value="exact">Exact</Radio>
            <Radio value="prefix">Prefix</Radio>
            <Radio value="regex">Regex</Radio>
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
            addonAfter="Test"
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
        <FormItem
          label='修改请求参数'
          name='reqChange'
          valuePropName='checked'
          initialValue={reqChange}
        >
          <Switch onChange={checked => {
            form.setFieldsValue({reqChange: checked});
            setSetting({reqChange: checked});
          }} />
        </FormItem>
        {reqChange && <FormItem
          label='代码'
          name='reqChangeCode'
          initialValue={reqChangeCode}
        >
          {renderAce('reqChangeCode')}
        </FormItem>}
      </Form>
    </Modal>
  );
};

export default SettingDetail;
