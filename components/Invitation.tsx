import { useState, useCallback } from 'react';
import qrcode from 'qrcode';
import {
  Box,
  Center,
  Heading,
  Text,
  Flex,
  Button,
  ButtonGroup,
  IconButton,
  Image,
  Stack,
  Divider,
  FormLabel,
  HStack,
  Input,
  PinInput,
  PinInputField,
  useToast,
  useClipboard,
} from '@chakra-ui/react'
import { CopyIcon } from '@chakra-ui/icons';

const width = 128;

function generateURL(shareKey: string) {
  return `${window.location.origin}?key=${shareKey}`;
}

type Props = {
  shareKey: string;
  onPinInputComplete: Function;
};

export function Invitation(props: Props) {
  const [ qr, setQR ] = useState('');
  const url = generateURL(props.shareKey);
  const toast = useToast()
  const { hasCopied, onCopy } = useClipboard(url);

  qrcode.toDataURL(url, { width, margin: 0 }, (err, q) => {
    if (q !== qr) {
      setQR(q);
    }
  });


  return (
    <Box>
      <Stack>
        <Heading size="md">招待する</Heading>
        <Center>
          <Stack>
            <Heading size="2xl">{props.shareKey ? props.shareKey : '取得中'}</Heading>
            <Image src={qr} fallbackSrc='https://via.placeholder.com/198' />
          </Stack>
        </Center>
      </Stack>

      <Flex py={4}>
        <ButtonGroup w="100%" isAttached variant='outline' onClick={() => {
          toast({
            title: 'コピーしました',
            duration: 4000,
          });
          onCopy();
        }}>
          <Button w="100%" justifyContent="left">{url}</Button>
          <IconButton icon={<CopyIcon />} />
        </ButtonGroup>
      </Flex>

      <Divider />

      <Flex pt={4} pb={4}>
        <Stack w="100%">
          <Heading size="md">参加する</Heading>
          <Input
            type="text"
            autoComplete="off"
            inputMode="email"
            placeholder="4桁の共有キーを入力"
            maxLength={6}
            onChange={(event) => {
              const shareKey = event.currentTarget.value;
              if (/([0-9a-zA-Z]{4})/.test(shareKey)) {
                props.onPinInputComplete(shareKey);
                event.currentTarget.value = '';
              }
            }}
          />
        </Stack>
      </Flex>
    </Box>
  );
}
