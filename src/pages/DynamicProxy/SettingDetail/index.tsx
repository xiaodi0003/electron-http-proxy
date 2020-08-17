import { Form, Modal, Input, Select, Radio, Switch, Upload } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { ProxySetting } from '@/models/connect';
import HookCodeAce from './HookCodeAce';
import './index.less';

const {Option} = Select;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

const removeProtocol = (url: string) => url.replace(/^.*?:\/\//, '');
const getProtocol = (url: string) => url.replace(/(.*?):.*/, '$1');
const hasProtocol = (url: string) => ['http', 'https', 'file'].includes(getProtocol(url))

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 12 },
};

const getInitReqChangeCode = () => `// 按需修改url、headers、body，可以返回具体的值，也可以返回一个Promise
async function reqHook({url, headers, body}) {
  return {url, headers, body};
}`;

const getInitResChangeCode = () => `// 按需修改headers、body，可以返回具体的值，也可以返回一个Promise
async function resHook(request, {code, headers, body}) {
  return {code, headers, body};
}`;

const SettingDetail: React.FC<{setting: ProxySetting; onOk: any}> = ({
  setting,
  onOk
}) => {
  const [showTest, setShowTest] = useState(false);
  const [nowSetting, setNowSetting] = useState(setting);
  nowSetting.type = nowSetting.type || 'exact';
  nowSetting.from = nowSetting.from || 'http://';
  nowSetting.to = nowSetting.to || 'http://';
  nowSetting.enabled = nowSetting.enabled !== false;
  nowSetting.reqHook = nowSetting.reqHook || false;
  nowSetting.reqHookCode = nowSetting.reqHookCode || getInitReqChangeCode();
  nowSetting.resHook = nowSetting.resHook || false;
  nowSetting.resHookCode = nowSetting.resHookCode || getInitResChangeCode();
  nowSetting.delay = nowSetting.delay || 0;

  const {type, from, to, enabled, reqHook, reqHookCode, resHook, resHookCode, delay} = nowSetting;
  const [form] = Form.useForm();
  const disableTo = !!reqHook;

  // todo 这里的代码有问题，不会触发render
  const setSetting = (s: object) => setNowSetting(Object.assign(nowSetting, s));

  const selectFromProtocol = (
    <Select value={getProtocol(from)} style={{ width: 90 }} onChange={v => setSetting({from: `${v}://${removeProtocol(from)}`})}>
      <Option value="http">http://</Option>
      <Option value="https">https://</Option>
    </Select>
  );

  const selectToProtocol = (
    <Select disabled={disableTo} value={getProtocol(to)} style={{ width: 90 }} onChange={v => setSetting({to: `${v}://${removeProtocol(to)}`})}>
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
      setSetting({[field]: `${getProtocol(oldValue)}://${url}`});
      form.setFieldsValue({[field]: url});
    }
    // 用form的dependence来实现一个变化触发另一个校验貌似有bug：A依赖B，只有到A变化之后，B的变化才触发A的校验
    // 所以需要手动触发
    form.validateFields(['test']);
  }

  function onSelectFile({file}) {
    setFromToForm(file.originFileObj.path, 'to', to);
  }

  function testFrom(testUrl, fromUrl, nowType) {
    switch(nowType) {
      case 'regex':
        return new RegExp(fromUrl).test(testUrl);
      case 'prefix':
        return testUrl.startsWith(fromUrl);
      case 'exact':
      default:
        return testUrl === fromUrl;
    }
  }

  const onFinish = () => onOk(nowSetting);

  const renderAce = (codeKey: string) => (<HookCodeAce
    onChange={(value) => {
      form.setFieldsValue({[codeKey]: value});
      setSetting({[codeKey]: value});
    }}
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
            setSetting({type: value});
            form.setFieldsValue({type: value});
            form.validateFields(['test']);
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
            addonAfter={<span onClick={() => setShowTest(!showTest)}>Test</span>}
            onChange={({target: {value}}) => setFromToForm(value, 'from', from)}
          />
        </FormItem>
        {showTest && <FormItem
          label='Test'
          name='test'
          initialValue={from}
          dependencies={['type', 'from']}
          rules={[({ getFieldValue }) => ({
            validator(rule, value) {
              return new Promise((resolve, reject) => {
                if (testFrom(value, nowSetting.from, nowSetting.type)) {
                  resolve();
                } else {
                  reject('Not match!');
                }
              });
            },
          })]}
        >
          <Input
            className='test'
            allowClear
            addonAfter={<CloseOutlined onClick={() => setShowTest(false)} />}
          />
        </FormItem>}
        <FormItem
          label='代理目标'
          name='to'
          rules={[{
            required: !disableTo && true,
            message: '必填'
          }]}
          initialValue={removeProtocol(to)}
        >
          <Input
            disabled={disableTo}
            addonBefore={selectToProtocol}
            addonAfter={to.startsWith('file://') && <Upload onChange={onSelectFile} fileList={[]}>选择</Upload>}
            onChange={({target: {value}}) => setFromToForm(value, 'to', to)}
          />
        </FormItem>

        <FormItem
          label='延迟'
          name='delay'
          rules={[{
            type: 'number',
            message: '只能填写数字'
          }]}
          initialValue={delay}
        >
          <Input
            onChange={({target: {value}}) => {
              const v = isNaN(Number(value)) ? delay : Number(value);
              form.setFieldsValue({delay: v});
              setSetting({delay: v});
            }}
          />
        </FormItem>

        <FormItem
          label='修改请求参数'
          name='reqHook'
          valuePropName='checked'
          initialValue={reqHook}
        >
          <Switch onChange={checked => {
            form.setFieldsValue({reqHook: checked});
            setSetting({reqHook: checked});
          }} />
        </FormItem>
        {reqHook && <FormItem
          label='代码'
          name='reqHookCode'
          initialValue={reqHookCode}
        >
          {renderAce('reqHookCode')}
        </FormItem>}

        <FormItem
          label='修改响应结果'
          name='resHook'
          valuePropName='checked'
          initialValue={resHook}
        >
          <Switch onChange={checked => {
            form.setFieldsValue({resHook: checked});
            setSetting({resHook: checked});
          }} />
        </FormItem>
        {resHook && <FormItem
          label='代码'
          name='resHookCode'
          initialValue={resHookCode}
        >
          {renderAce('resHookCode')}
        </FormItem>}
      </Form>
    </Modal>
  );
};

export default SettingDetail;
