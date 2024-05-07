import React, { useEffect, useState } from 'react';
import { Paragraph, TextInput, Button, FormControl, Flex, Box, Caption, Switch, Select } from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppInstallationParameters, IRemotedAppUrl } from './ConfigScreen';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const cma = sdk.cma;
  const fieldLocale = sdk.field.locale;
  const installationParameters = sdk.parameters.installation as AppInstallationParameters; // From App Config (ConfigScreen)
  const instanceParameters = sdk.parameters.instance; // From App Definition
  const isFieldReliedOnInstallationParams = instanceParameters?.usingInstallationParameters ?? false;

  //type FieldType = "Symbol" | "Text" | "RichText" | "Number" | "Integer" | "Array" | "Link" | "Object" | "Date" | "Location" | "Boolean"
  const fieldType = sdk.field.type //Exclude<FieldType, 'Array' | 'Link'>;
  // console.log(fieldType)
  // Get the Entry details
  // Content Model
  // console.log(`Entry: ${JSON.stringify(sdk.entry)}`)
  // get entry id
  // console.log(`Entry: ${JSON.stringify(sdk.entry.getSys())}`)
  // const spaceId = sdk.entry.getSys().space.sys.id;
  // const space = cma.space.get({ spaceId: spaceId })
  //    .then((_space) => console.log(_space));


  // Getting individual fields of the Entry
  // console.log(`Entry: ${JSON.stringify(sdk.entry.fields['selfRef'])}`);


  const [originalValue, setOriginalValue] = useState(sdk.field.getValue());
  const [commonValue, setCommonValue] = useState<boolean | string | undefined>();
  const [hasSelfRef, setHasSelfRef] = useState(false);
  const [refId, setRefId] = useState();
  const [selectionData, setSelectionData] = useState<IRemotedAppUrl[]>([]);
  const [shouldRenderSelection, setShouldRenderSelection] = useState<boolean>(false);

  useEffect(() => {
    sdk.window.startAutoResizer()
  }, [sdk.window])

  useEffect(() => {
    const entryTags = sdk.entry.getMetadata()?.tags;
    const _currentEntryBrandTags = entryTags?.filter(item => item.sys.id.toLowerCase().startsWith('brand')).map(item => item.sys.id) ?? [];
    const _currentEntryProductTags = entryTags?.filter(item => item.sys.id.toLowerCase().startsWith('product')).map(item => item.sys.id) ?? [];
    const _shouldRenderSelection = !(_currentEntryBrandTags?.length === 1 && _currentEntryProductTags?.length === 1)
    const _selectionData = [] as IRemotedAppUrl[];
    setShouldRenderSelection(_shouldRenderSelection);

    if (_shouldRenderSelection) {
      for (const [key, value] of Object.entries(installationParameters)) {
        if (_currentEntryBrandTags.includes(value.brand) || _currentEntryProductTags.includes(value.product)) {
          _selectionData.push(
            value
          )
        }
      }
    } else {
      _selectionData.push(
        installationParameters[`${_currentEntryBrandTags[0]}-${_currentEntryProductTags[0]}`]
      )
    }

    if (!_shouldRenderSelection && isFieldReliedOnInstallationParams) {
      setOriginalValue(_selectionData[0].url)
    }

    setSelectionData(
      _selectionData.filter(item => item.url !== '')
    )
  }, [installationParameters, isFieldReliedOnInstallationParams, sdk.entry])


  useEffect(() => {
    sdk.field.setValue(originalValue)
  }, [originalValue, sdk.field])

  useEffect(() => {
    if (refId) {
      cma.entry.get({ entryId: refId }).then(ref => {
        //console.log(`Ref entry: ${JSON.stringify(ref)}`)
        //console.log(`Ref entry {${sdk.field.id}}: ${JSON.stringify(ref.fields[sdk.field.id][fieldLocale])}`)
        if (ref.fields[sdk.field.id] && ref.fields[sdk.field.id][fieldLocale]) {
          setCommonValue(ref.fields[sdk.field.id][fieldLocale])
        } else {
          setCommonValue(undefined)
        }
        if (!sdk.field.getValue()) {
          if (ref.fields[sdk.field.id] && ref.fields[sdk.field.id][fieldLocale]) {
            setOriginalValue(ref.fields[sdk.field.id][fieldLocale])
          } else {
            setOriginalValue(undefined)
          }
        }
      })
    }
  }, [cma.entry, fieldLocale, refId, sdk.field])

  useEffect(() => {
    const hasSelfRefField = sdk.entry.fields['selfRef']
    if (hasSelfRefField) {
      const onSelfRefFieldChanged = () => {
        const _hasSelfRef = sdk.entry.fields['selfRef'] && sdk.entry.fields['selfRef'].getValue()
        const _refId = _hasSelfRef ? sdk.entry.fields['selfRef'].getValue()['sys']['id'] : undefined
        setHasSelfRef(_hasSelfRef)
        setRefId(_refId)
      }

      sdk.entry.fields['selfRef'].onValueChanged(onSelfRefFieldChanged)
    }
  }, [sdk.entry.fields])
  // List of environments
  // Need it to populate the corresponding remoteAppUrls
  //  console.log(`Environment: ${sdk.ids.environmentAlias ?? sdk.ids.environment}`)

  // Get the type of the field
  // to render the corresponding component
  // type	String, one of Symbol, Enum, Number, Boolean
  // console.log(`Field type: ${JSON.stringify(sdk.field)}`) // it is Symbol if type = Text => https://www.contentful.com/developers/docs/extensibility/app-framework/app-parameters/


  //console.log(`Has SelfRef Reference: ${hasSelfRef ? 'YES' : 'NO'}`)

  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();
  // If you only want to extend Contentful's default editing experience
  // reuse Contentful's editor components
  // -> https://www.contentful.com/developers/docs/extensibility/field-editors/

  const unSetOriginalValue = () => {
    setOriginalValue(commonValue)
  }

  const onOriginalValueChanged = (event: { target: { value: any; }; }) => {
    const val = event.target.value
    setOriginalValue(val.trim() === '' ? commonValue : val)
  }

  if (hasSelfRef) {
    if (fieldType === 'Symbol') {
      return (
        <>
          {!isFieldReliedOnInstallationParams ?
            <>
              <FormControl>
                <FormControl.Label>Overwritten value</FormControl.Label>
                <Flex flexDirection="row" gap="spacingS">
                  <Flex
                    flexGrow={1}
                  >
                    <TextInput value={originalValue} onChange={onOriginalValueChanged} />
                  </Flex>
                  <Box>
                    <Button variant="positive" onClick={unSetOriginalValue} isDisabled={commonValue === originalValue}>Unset</Button>
                  </Box>
                </Flex>
                <Caption>If empty, it will take Shared value = '{commonValue}'</Caption>
              </FormControl>
              <FormControl>
                <FormControl.Label>Shared value</FormControl.Label>
                <TextInput isDisabled value={commonValue} />
              </FormControl>
            </>
            :
            <>
              <FormControl>
                <FormControl.Label>Overwritten value</FormControl.Label>
                <Flex flexDirection="row" gap="spacingS">
                  <Flex
                    flexGrow={1}
                  >
                    <>
                      {
                        shouldRenderSelection ?
                          <>
                            <Flex flexDirection="row" gap="spacingS">
                              <Flex
                                flexGrow={1}
                              >
                                <TextInput value={originalValue} onChange={(e) => setOriginalValue(e.target.value)} />
                              </Flex>
                              <Box>
                                <Select
                                  onChange={(e) => setOriginalValue(e.target.value)}
                                >
                                  {
                                    selectionData.map((item, index) => {
                                      return <Select.Option key={item.id} value={item.url}>{item.url}</Select.Option>
                                    })
                                  }
                                </Select>
                              </Box>
                            </Flex>

                          </>
                          :
                          <TextInput value={originalValue} onChange={(e) => setOriginalValue(e.target.value)} />
                      }
                    </>
                  </Flex>
                  <Box>
                    <Button variant="positive" onClick={unSetOriginalValue} isDisabled={commonValue === originalValue}>Unset</Button>
                  </Box>
                </Flex>
                <Caption>If empty, it will take Shared value = '{commonValue}'</Caption>
              </FormControl>
              <FormControl>
                <FormControl.Label>Shared value</FormControl.Label>
                <TextInput isDisabled value={commonValue} />
              </FormControl>
            </>

          }
        </>
      )
    }
    else if (fieldType === 'Boolean') {
      return (
        <>
          <FormControl>
            <FormControl.Label>Overwritten value</FormControl.Label>
            <Flex flexDirection="row" gap="spacingS">
              <Flex
                flexGrow={1}
              >
                <Switch
                  isChecked={originalValue}
                  size='medium'
                  onChange={() => setOriginalValue((prevState: boolean) => !prevState)}
                >
                  {sdk.field.name}
                </Switch>
              </Flex>
              <Box>
                <Button variant="positive" onClick={unSetOriginalValue} isDisabled={commonValue === originalValue}>Unset</Button>
              </Box>
            </Flex>
            <Caption>If empty, it will take Shared value = '{commonValue ? 'true' : 'false'}'</Caption>
          </FormControl>
          <FormControl>
            <FormControl.Label>Shared value</FormControl.Label>
            <Switch
              isDisabled
              size='medium'
              isChecked={commonValue}
            >
              {sdk.field.name}
            </Switch>
          </FormControl>
        </>
      )
    } else {
      return <Paragraph>No supported question type</Paragraph>
    }
  }

  if (fieldType === 'Symbol') {
    return (
      <>
        {!isFieldReliedOnInstallationParams ?
          <TextInput value={originalValue} onChange={(e) => setOriginalValue(e.target.value)} /> :
          <>
            {
              shouldRenderSelection ?
                <>
                  <Flex flexDirection="row" gap="spacingS">
                    <Flex
                      flexGrow={1}
                    >
                      <TextInput value={originalValue} onChange={(e) => setOriginalValue(e.target.value)} />
                    </Flex>
                    <Box>
                      <Select
                        onChange={(e) => setOriginalValue(e.target.value)}
                      >
                        {
                          selectionData.map((item, index) => {
                            return <Select.Option key={item.id} value={item.url}>{item.url}</Select.Option>
                          })
                        }
                      </Select>
                    </Box>
                  </Flex>

                </>
                :
                <TextInput value={originalValue} onChange={(e) => setOriginalValue(e.target.value)} />
            }
          </>
        }
      </>
    )
  } else if (fieldType === 'Boolean') {
    return (
      <Switch
        isChecked={originalValue}
        size='medium'
        onChange={() => setOriginalValue((prevState: boolean) => !prevState)}
      >
        {sdk.field.name}
      </Switch>
    )
  } else {
    return <Paragraph>No supported question type</Paragraph>
  }
};

export default Field;
