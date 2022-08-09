import * as React from 'react';

type ComboBoxTypes = Omit<
  React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  'onChange' | 'value'
> & {
  value?: Record<string, unknown>;
  options: Record<string, unknown>[];
  optionLabel: string;
  key?: string;
  onChange?: (event: any, selectedValue: any) => void;
};

export default function ComboBox(props: ComboBoxTypes) {
  const { value, options: comboBoxOptions, optionLabel, key } = props;
  const [options, setOptions] = React.useState(comboBoxOptions);
  const [focused, setFocused] = React.useState(false);
  const [inputValue, setInputValue] = React.useState<string>('');
  const [activeDescendant, setActiveDescendant] = React.useState('');

  const inputRef = React.useRef<HTMLInputElement>();

  const filterResult = (userInputvalue: string) => {
    const filteredOptions =
      userInputvalue === ''
        ? comboBoxOptions
        : comboBoxOptions.filter((option) =>
            (option[optionLabel] as string).toLowerCase()?.includes(userInputvalue.toLowerCase()),
          );
    setOptions(filteredOptions);
  };

  const onChange = (event: React.ChangeEvent) => {
    const { value: userInputvalue } = event.target as HTMLInputElement;
    setInputValue(userInputvalue);
    filterResult(userInputvalue);
  };

  const getDescendants = (
    inputTarget: HTMLInputElement,
  ): { nextDescendant?: HTMLOptionElement; previousDescendant?: HTMLOptionElement } => {
    const descendant = inputTarget.getAttribute('aria-activedescendant');
    let nextDescendant: HTMLOptionElement | undefined;
    let previousDescendant: HTMLOptionElement | undefined;
    // Select first descendant from options if activedescendant is empty
    if (descendant === '') {
      nextDescendant = document.getElementsByTagName('option')[0];
    } else {
      const optionNodes = document.getElementsByTagName('option');
      for (let i = 0; i < optionNodes.length; i += 1) {
        if (optionNodes[i].getAttribute('id') === descendant) {
          previousDescendant = optionNodes[i - 1] ?? optionNodes[optionNodes.length - 1];
          nextDescendant = optionNodes[i + 1] ?? optionNodes[0];
        }
      }
    }

    return { nextDescendant, previousDescendant };
  };

  const getOptionId = (descendant: HTMLOptionElement | undefined) => {
    if (descendant && descendant.parentElement) {
      descendant.parentElement.scrollTop = descendant.offsetTop;
      return descendant?.getAttribute('id') ?? '';
    }
    return '';
  };

  const handleNextActiveOption = (event: React.KeyboardEvent) => {
    const inputTarget = event.target as HTMLInputElement;
    const { nextDescendant } = getDescendants(inputTarget);
    return { optionId: getOptionId(nextDescendant), descendant: nextDescendant };
  };

  const handlePreviousActiveOption = (event: React.KeyboardEvent) => {
    const inputTarget = event.target as HTMLInputElement;
    const { previousDescendant } = getDescendants(inputTarget);
    return { optionId: getOptionId(previousDescendant), descendant: previousDescendant };
  };

  const setActiveDescendantAttribute = (optionId: string, inputTarget: HTMLInputElement) => {
    setActiveDescendant(optionId);
    inputTarget.setAttribute('aria-activedescendant', optionId);
  };

  const handleSelectedValue = (event: React.KeyboardEvent | React.MouseEvent) => {
    const selectedOptionIndex = activeDescendant.split('focused')[1];
    const selectedOption = options[+selectedOptionIndex];
    setInputValue(selectedOption[optionLabel] as string);
    props?.onChange?.(event, selectedOption);
  };

  const handleResetFocus = () => {
    setFocused(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    setFocused(true);
    const inputTarget = event.target as HTMLInputElement;
    let option: {
      optionId: string;
      descendant: HTMLOptionElement | undefined;
    };

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        if (event.key === 'ArrowDown') {
          option = handleNextActiveOption(event);
          setActiveDescendantAttribute(option?.optionId, inputTarget);
        } else if (event.key === 'ArrowUp') {
          option = handlePreviousActiveOption(event);
          setActiveDescendantAttribute(option?.optionId, inputTarget);
        }
        break;
      case 'Enter': {
        event.preventDefault();
        handleSelectedValue(event);
        handleResetFocus();
        break;
      }
      default:
        break;
    }
  };

  const handleResetOptions = () => {
    setInputValue('');
    setOptions(comboBoxOptions);
    setFocused(false);
    setActiveDescendant('');
  };

  const handleOpen = () => {
    setFocused(true);
  };

  const handleOptionClicked = (event: React.SyntheticEvent, id: string, option: string) => {
    setActiveDescendant(id);
    props?.onChange?.(event, option);
    setInputValue(option);
    setFocused(false);
  };

  React.useEffect(() => {
    inputRef?.current?.focus();
  }, []);

  React.useEffect(() => {
    setInputValue((value?.[optionLabel] as string) ?? '');
  }, [value, optionLabel]);

  React.useEffect(() => {
    if (focused) {
      const activeOption = document.getElementById(activeDescendant);
      if (activeOption && activeOption.parentElement) {
        activeOption.parentElement.scrollTop = activeOption.offsetTop;
      }
    }
  }, [focused, activeDescendant]);

  return (
    <div className="combobox-wrapper" style={{ maxWidth: props.style?.width ?? '30%' }}>
      <div className="combobox-input-wrapper">
        <input
          ref={inputRef as React.MutableRefObject<HTMLInputElement | null>}
          tabIndex={0}
          value={inputValue}
          style={{ width: '100%' }}
          onClick={() => handleOpen()}
          type="text"
          placeholder="ComboBox"
          className="combobox-input"
          onBlur={(e) => {
            if (!e.relatedTarget) {
              handleResetFocus();
            }
          }}
          aria-activedescendant={activeDescendant}
          onChange={onChange}
          onKeyDown={handleKeyDown}
        />
        {inputValue !== '' && (
          <button
            type="button"
            className="combobox-remove-selection"
            onClick={() => handleResetOptions()}
          >
            ✖
          </button>
        )}
      </div>
      {focused && (
        <div className="combobox-list" role="button" tabIndex={0}>
          {options.length > 0 ? (
            <React.Fragment>
              {options?.map((option, index) => {
                const listKey = key ?? index;
                const id = `focused${listKey}`;
                return (
                  <option
                    key={listKey}
                    tabIndex={0}
                    id={id}
                    className={activeDescendant === id ? 'active-combobox' : ''}
                    value={option[optionLabel] as string}
                    onClick={(e) => handleOptionClicked(e, id, option[optionLabel] as string)}
                  >
                    {option[optionLabel] as string}
                  </option>
                );
              })}
            </React.Fragment>
          ) : (
            <div>No options</div>
          )}
        </div>
      )}
    </div>
  );
}
