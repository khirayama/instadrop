import React, { useState } from 'react'
import qrcode from 'qrcode'
import {
  Box,
  Center,
  Heading,
  Flex,
  Button,
  ButtonGroup,
  IconButton,
  Image,
  Stack,
  Divider,
  Input,
  useToast,
  useClipboard
} from '@chakra-ui/react'
import { CopyIcon } from '@chakra-ui/icons'
import i18next from 'i18next'

const size = 128
const t = i18next.t

function generateURL (lng: string, shareKey: string): string {
  return `${window.location.origin}/?key=${shareKey}`
}

interface Props {
  lng: string
  shareKey: string
  onPinInputComplete: Function
}

export function Invitation (props: Props): JSX.Element {
  const [qr, setQR] = useState('')
  const url = generateURL(props.lng, props.shareKey)
  const toast = useToast()
  const { onCopy } = useClipboard(url)

  qrcode.toDataURL(url, { width: size * 2, margin: 0 }, (_, q) => {
    if (q !== qr) {
      setQR(q)
    }
  })

  return (
    <Box>
      <Stack>
        <Heading size="md">{t('invite')}</Heading>
        <Center>
          <Stack>
            <Heading size="2xl">{props.shareKey !== '' ? props.shareKey : t('loadingShareKey')}</Heading>
            <Image alt={t('qrcodeAlt', { shareKey: props.shareKey })} src={qr} width={size} height={size} />
          </Stack>
        </Center>
      </Stack>

      <Flex py={4}>
        <ButtonGroup w="100%" isAttached variant='outline' onClick={() => {
          toast({
            title: t('copyToast'),
            duration: 4000
          })
          onCopy()
        }}>
          <Button w="100%" justifyContent="left">{url}</Button>
          <IconButton icon={<CopyIcon />} aria-label={t('copy')} />
        </ButtonGroup>
      </Flex>

      <Divider />

      <Flex py={4}>
        <Stack w="100%">
          <Heading size="md">{t('join')}</Heading>
          <Input
            type="text"
            autoComplete="off"
            inputMode="email"
            placeholder={t('shareKeyInputPlaceholder')}
            maxLength={6}
            onChange={(event) => {
              const shareKey = event.currentTarget.value
              if (/([0-9a-zA-Z]{4})/.test(shareKey)) {
                props.onPinInputComplete(shareKey)
                event.currentTarget.value = ''
                event.currentTarget.blur()
              }
            }}
          />
        </Stack>
      </Flex>
    </Box>
  )
}
