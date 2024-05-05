import React, { useEffect, useState } from 'react';
import { TextInput, Button, FormControl, Flex, Box, Caption } from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const cma = sdk.cma;
  const fieldLocale = sdk.field.locale;
  // Get the Entry details
  // Content Model
  // console.log(`Entry: ${JSON.stringify(sdk.entry)}`)
  // get entry id
  // console.log(`Entry: ${JSON.stringify(sdk.entry.getSys())}`)
  // const spaceId = sdk.entry.getSys().space.sys.id;
  // const space = cma.space.get({ spaceId: spaceId })
  //    .then((_space) => console.log(_space));
  // const entryId = sdk.entry.getSys().id;

  // Getting individual fields of the Entry
  // console.log(`Entry: ${JSON.stringify(sdk.entry.fields['selfRef'])}`);

  const [originalValue, setOriginalValue] = useState(sdk.field.getValue());
  const [commonValue, setCommonValue] = useState('');
  const [hasSelfRef, setHasSelfRef] = useState(false);
  const [refId, setRefId] = useState();

  useEffect(() => {
    sdk.window.startAutoResizer()
  }, [sdk.window])

  useEffect(() => {
    sdk.field.setValue(originalValue)
  }, [originalValue, sdk.field])

  useEffect(() => {
    if (refId) {
      cma.entry.get({ entryId: refId }).then(ref => {
        //console.log(`Ref entry: ${JSON.stringify(ref)}`)
        //console.log(`Ref entry {${sdk.field.id}}: ${JSON.stringify(ref.fields[sdk.field.id][fieldLocale])}`)
        setCommonValue(ref.fields[sdk.field.id][fieldLocale])
        if (!sdk.field.getValue()) {
          setOriginalValue(ref.fields[sdk.field.id][fieldLocale])
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

  const unSetOriginalValue = (event) => {
    setOriginalValue(commonValue)
  }

  const onOriginalValueChanged = (event) => {
    const val = event.target.value
    setOriginalValue(val.trim() === '' ? commonValue : val)
  }

  if (hasSelfRef) {
    return (
      <>
        <FormControl>
          <FormControl.Label>Overwritten value</FormControl.Label>
          <Flex flexDirection="row" gap="spacingS">
            <Flex
              flexGrow={1}
            >
              <TextInput value={originalValue} onChange={onOriginalValueChanged}/>
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
    )
  }

  return (
    <TextInput value={originalValue} onChange={(e) => setOriginalValue(e.target.value)}/>
  )
};

export default Field;
