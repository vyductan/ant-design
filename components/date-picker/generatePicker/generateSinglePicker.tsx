import * as React from 'react';

import type { CommonPickerMethods, DatePickRef, PickerComponentClass } from './interface';
import { Components, getTimeProps } from '.';
import type { PickerDateProps, PickerProps, PickerTimeProps } from '.';
import { forwardRef, useContext, useImperativeHandle } from 'react';
import { getMergedStatus, getStatusClassNames } from '../../_util/statusUtils';
import { getPlaceholder, transPlacement2DropdownAlign } from '../util';

import CalendarOutlined from '@ant-design/icons/CalendarOutlined';
import ClockCircleOutlined from '@ant-design/icons/ClockCircleOutlined';
import CloseCircleFilled from '@ant-design/icons/CloseCircleFilled';
import { ConfigContext } from '../../config-provider';
import DisabledContext from '../../config-provider/DisabledContext';
import { FormItemInputContext } from '../../form/context';
import type { GenerateConfig } from 'rc-picker/lib/generate/index';
import type { InputStatus } from '../../_util/statusUtils';
import LocaleReceiver from '../../locale-provider/LocaleReceiver';
import type { PickerMode } from 'rc-picker/lib/interface';
import RCPicker from 'rc-picker';
import SizeContext from '../../config-provider/SizeContext';
import classNames from 'classnames';
import enUS from '../locale/en_US';
import warning from '../../_util/warning';

export default function generatePicker<DateType>(generateConfig: GenerateConfig<DateType>) {
  type DatePickerProps = PickerProps<DateType> & {
    status?: InputStatus;
    /**
     * @deprecated `dropdownClassName` is deprecated which will be removed in next major
     *   version.Please use `popupClassName` instead.
     */
    dropdownClassName?: string;
    popupClassName?: string;
  };
  function getPicker<InnerPickerProps extends DatePickerProps>(
    picker?: PickerMode,
    displayName?: string,
  ) {
    const Picker = forwardRef<DatePickRef<DateType> | CommonPickerMethods, InnerPickerProps>(
      (props, ref) => {
        const {
          prefixCls: customizePrefixCls,
          getPopupContainer: customizeGetPopupContainer,
          className,
          size: customizeSize,
          bordered = true,
          placement,
          placeholder,
          popupClassName,
          dropdownClassName,
          disabled: customDisabled,
          status: customStatus,
          ...restProps
        } = props;

        const { getPrefixCls, direction, getPopupContainer } = useContext(ConfigContext);
        const prefixCls = getPrefixCls('picker', customizePrefixCls);
        const innerRef = React.useRef<RCPicker<DateType>>(null);
        const { format, showTime } = props as any;

        useImperativeHandle(ref, () => ({
          focus: () => innerRef.current?.focus(),
          blur: () => innerRef.current?.blur(),
        }));

        const additionalProps = {
          showToday: true,
        };

        let additionalOverrideProps: any = {};
        if (picker) {
          additionalOverrideProps.picker = picker;
        }
        const mergedPicker = picker || props.picker;

        additionalOverrideProps = {
          ...additionalOverrideProps,
          ...(showTime ? getTimeProps({ format, picker: mergedPicker, ...showTime }) : {}),
          ...(mergedPicker === 'time'
            ? getTimeProps({ format, ...props, picker: mergedPicker })
            : {}),
        };
        const rootPrefixCls = getPrefixCls();

        // =================== Warning =====================
        warning(
          picker !== 'quarter',
          displayName!,
          `DatePicker.${displayName} is legacy usage. Please use DatePicker[picker='${picker}'] directly.`,
        );

        warning(
          !dropdownClassName,
          'DatePicker',
          '`dropdownClassName` is deprecated which will be removed in next major version. Please use `popupClassName` instead.',
        );
        // ===================== Size =====================
        const size = React.useContext(SizeContext);
        const mergedSize = customizeSize || size;

        // ===================== Disabled =====================
        const disabled = React.useContext(DisabledContext);
        const mergedDisabled = customDisabled || disabled;

        // ===================== FormItemInput =====================
        const formItemContext = useContext(FormItemInputContext);
        const { hasFeedback, status: contextStatus, feedbackIcon } = formItemContext;

        const suffixNode = (
          <>
            {mergedPicker === 'time' ? <ClockCircleOutlined /> : <CalendarOutlined />}
            {hasFeedback && feedbackIcon}
          </>
        );

        return (
          <LocaleReceiver componentName="DatePicker" defaultLocale={enUS}>
            {contextLocale => {
              const locale = { ...contextLocale, ...props.locale };

              return (
                <RCPicker<DateType>
                  ref={innerRef}
                  placeholder={getPlaceholder(mergedPicker, locale, placeholder)}
                  suffixIcon={suffixNode}
                  dropdownAlign={transPlacement2DropdownAlign(direction, placement)}
                  dropdownClassName={popupClassName || dropdownClassName}
                  clearIcon={<CloseCircleFilled />}
                  prevIcon={<span className={`${prefixCls}-prev-icon`} />}
                  nextIcon={<span className={`${prefixCls}-next-icon`} />}
                  superPrevIcon={<span className={`${prefixCls}-super-prev-icon`} />}
                  superNextIcon={<span className={`${prefixCls}-super-next-icon`} />}
                  allowClear
                  transitionName={`${rootPrefixCls}-slide-up`}
                  {...additionalProps}
                  {...restProps}
                  {...additionalOverrideProps}
                  locale={locale!.lang}
                  className={classNames(
                    {
                      [`${prefixCls}-${mergedSize}`]: mergedSize,
                      [`${prefixCls}-borderless`]: !bordered,
                    },
                    getStatusClassNames(
                      prefixCls as string,
                      getMergedStatus(contextStatus, customStatus),
                      hasFeedback,
                    ),
                    className,
                  )}
                  prefixCls={prefixCls}
                  getPopupContainer={customizeGetPopupContainer || getPopupContainer}
                  generateConfig={generateConfig}
                  components={Components}
                  direction={direction}
                  disabled={mergedDisabled}
                />
              );
            }}
          </LocaleReceiver>
        );
      },
    );

    if (displayName) {
      Picker.displayName = displayName;
    }

    return Picker as unknown as PickerComponentClass<InnerPickerProps>;
  }

  const DatePicker = getPicker<DatePickerProps>();
  const WeekPicker = getPicker<Omit<PickerDateProps<DateType>, 'picker'>>('week', 'WeekPicker');
  const MonthPicker = getPicker<Omit<PickerDateProps<DateType>, 'picker'>>('month', 'MonthPicker');
  const YearPicker = getPicker<Omit<PickerDateProps<DateType>, 'picker'>>('year', 'YearPicker');
  //@ts-ignore
  const TimePicker = getPicker<Omit<PickerTimeProps<DateType>, 'picker'>>('time', 'TimePicker');
  //@ts-ignore
  const QuarterPicker = getPicker<Omit<PickerTimeProps<DateType>, 'picker'>>(
    'quarter',
    'QuarterPicker',
  );

  return { DatePicker, WeekPicker, MonthPicker, YearPicker, TimePicker, QuarterPicker };
}
