import { createRoot } from 'react-dom/client';
import { useState, useEffect, useCallback, createRef, FormEvent, StrictMode } from 'react';
import classNames from 'classnames';
import { io, Socket } from 'socket.io-client';
import {
  ChakraProvider,
  IconButton,
  Button,
  ButtonGroup,
  Text,
  Stack,
  HStack,
  Center,
  Grid,
  GridItem,
  Heading,
  Box,
  Flex,
  Spacer,
  Divider,
  Avatar,
  AvatarGroup,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  useClipboard,
} from '@chakra-ui/react'
import { CopyIcon } from '@chakra-ui/icons';

import { FileRecieveModal } from './components/FileRecieveModal';
import { UserForm } from './components/UserForm';
import { Invitation } from './components/Invitation';

export type User = {
  id: string;
  name: string;
  icon: string;
  device: string;
  browser: string;
};

type Props = {
  socket: Socket;
};

function Page(props: Props) {
  const socket = props.socket;

  const [ user, setUser ] = useState<User>({ id: '', name: '', icon: '' });
  const [ users, setUsers ] = useState([]);
  const [ shareKey, setShareKey ] = useState('');
  const [ files, setFiles ] = useState([]);
  const [ inputText, setInputText ] = useState('');
  const [ text, setText ] = useState('');
  const [ selectedUserIds, setSelectedUserIds ] = useState([]);

  const invitationModalDisclosure = useDisclosure();
  const fileRecieveModalDisclosure = useDisclosure();
  const textSendingModalDisclosure = useDisclosure();
  const textRecieveModalDisclosure = useDisclosure();
  const { hasCopied, onCopy } = useClipboard(text);
  const toast = useToast();

  const refInputFile = createRef();

  useEffect(() => {
    function popstateHandler() {
      socket.disconnect();
      socket.connect();
    }

    socket.on('update:user', (d) => {
      setShareKey(d.key)
      setUser(d.user)
      history.replaceState(null, '', `?key=${d.key}`)
    });

    socket.on('update:users', (d) => {
      setUsers(d.users);
    });

    socket.on('share:files', (payload) => {
      const fs = payload.files.map((f) => new File([f.data], f.name, { type: f.type }));
      setFiles(fs);
      fileRecieveModalDisclosure.onOpen();
    });

    socket.on('share:text', (payload) => {
      setText(payload.text);
      textRecieveModalDisclosure.onOpen();
    });

    window.addEventListener('popstate', popstateHandler);

    return function cleanup() {
      socket.off('update:user');
      socket.off('update:users');
      socket.off('share:files');
      socket.off('share:text');
      window.removeEventListener('popstate', popstateHandler);
    };
  });

  const onCreateNewSpaceButton = useCallback(() => {
    history.pushState(null, '', '/')
    socket.disconnect();
    socket.connect();
  }, []);

  const onPinInputComplete = useCallback((newShareKey) => {
    history.pushState(null, '', `/?key=${newShareKey}`)
    socket.disconnect();
    socket.connect();
  }, []);

  const onPaste = useCallback((event: ClipboardEvent<HTMLFormElement>) => {
    if (event.clipboardData.types[0] === "Files") {
      const dt = new DataTransfer();
      for (let i = 0; i < event.clipboardData.items.length; i += 1) {
        const item = event.clipboardData.items[i];
        dt.items.add(item.getAsFile());
      }
      refInputFile.current.files = dt.files;
      refInputFile.current.dispatchEvent(new Event('change', { bubbles: true }));
      setInputText('');
      textSendingModalDisclosure.onClose();
    }
  }, [refInputFile, setInputText, textSendingModalDisclosure]);

  const onUserFormClick = useCallback((event: MouseEvent<HTMLDivElement>, userFormProps: UserFormProps) => {
    if (userFormProps.selected) {
      const newSelectedUsers = selectedUserIds.filter((userId) => {
        return userFormProps.user.id !== userId;
      });
      setSelectedUserIds(newSelectedUsers);
    } else {
      setSelectedUserIds([...selectedUserIds, userFormProps.user.id]);
    }
  }, [selectedUserIds]);

  const onFileInputChange = useCallback((event: FormEvent<HTMLInputElement>) => {
    const el = event.target;
    if (el.type === 'file') {
      const d = new FormData();
      const fs = Array.from(el.files).map((f: File) => {
        return {
          name: f.name,
          type: f.type,
          data: f,
        };
      });
      const payload = {
        to: selectedUserIds,
        files: fs,
      };
      socket.emit('share:files', payload, (res) => {
        const targetUsers = users.filter((u) => selectedUserIds.indexOf(u.id) !== -1);
        if (res.status === 'ok') {
          el.value = '';
          toast({
            title: `${fs.length}件のファイルを${targetUsers.map((user) => user.name).join('、')}に共有しました`,
            duration: 4000,
          });
          setSelectedUserIds([]);
        }
      });
    }
  }, [users, selectedUserIds]);

  const onTextSubmit = useCallback((event: FormEvent<HTMLInputElement>) => {
    event.preventDefault();
    const payload = {
      to: selectedUserIds,
      text: inputText,
    };
    socket.emit('share:text', payload, (res) => {
      const targetUsers = users.filter((u) => selectedUserIds.indexOf(u.id) !== -1);
      if (res.status === 'ok') {
        setInputText('');
        toast({
          title: `入力したテキストを${targetUsers.map((user) => user.name).join('、')}に共有しました`,
          duration: 4000,
        });
        setSelectedUserIds([]);
        textSendingModalDisclosure.onClose();
      }
    });
  }, [user, selectedUserIds, inputText]);

  return (
    <>
      <Modal onClose={invitationModalDisclosure.onClose} isOpen={invitationModalDisclosure.isOpen} isCentered>
        <ModalOverlay />
        <ModalContent w="88%" maxW="420px">
          <ModalCloseButton />
          <ModalBody p={4}>
            <Invitation shareKey={shareKey} onPinInputComplete={(newShareKey) => {
              onPinInputComplete(newShareKey);
              invitationModalDisclosure.onClose();
            }}/>
          </ModalBody>
          <ModalFooter>
            <Button onClick={invitationModalDisclosure.onClose}>閉じる</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal onClose={textSendingModalDisclosure.onClose} isOpen={textSendingModalDisclosure.isOpen} isCentered>
        <ModalOverlay />
        <ModalContent w="88%" maxW="420px">
          <ModalHeader>テキストを共有</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={onTextSubmit} onPaste={onPaste} >
              <ButtonGroup w="100%">
                <Input autoFocus w="100%" placeholder='テキストを入力' value={inputText} onChange={(e) => setInputText(e.currentTarget.value)} />
                <Button type="submit">送信</Button>
              </ButtonGroup>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button onClick={textSendingModalDisclosure.onClose}>閉じる</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <FileRecieveModal disclosure={fileRecieveModalDisclosure} files={files} />

      <Modal onClose={textRecieveModalDisclosure.onClose} isOpen={textRecieveModalDisclosure.isOpen} isCentered>
        <ModalOverlay />
        <ModalContent w="88%" maxW="420px">
          <ModalHeader>テキストを共有されました。</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex>
              <ButtonGroup w="100%" isAttached variant='outline' onClick={() => {
                toast({
                  title: 'コピーしました',
                  duration: 4000,
                });
                onCopy();
              }}>
                <Button w="100%" justifyContent="left">{text}</Button>
                <IconButton icon={<CopyIcon />} />
              </ButtonGroup>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button onClick={textRecieveModalDisclosure.onClose}>閉じる</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Center p={4} bg="blue.100">
        <Button
          variant="link"
          onClick={onCreateNewSpaceButton}
        >新しい共有をはじめる</Button>
      </Center>

      <Divider />

      <Box p={4}>
        <Stack>
          <Heading as="h3" size="sm">あなた</Heading>
          <Flex>
            <Avatar
              size='lg'
              bg='blue.300'
              icon={<span>{user.icon}</span>}
              userSelect="none"
            />
            <Flex p={2}>
              <Stack spacing={0}>
                <Heading as="h3" size="sm">{user.name}</Heading>
                <Text>{user.device} {user.browser}</Text>
              </Stack>
            </Flex>
          </Flex>
        </Stack>
      </Box>

      <Divider />

      <Box>
        {users.length > 1 ? (
          <Stack p={4}>
            <Flex>
              <Center>
                <Heading as="h3" size="sm">共有可能な相手</Heading>
              </Center>
              <Spacer />
              <Button
                justifyContent="left"
                onClick={invitationModalDisclosure.onOpen}
              >招待する</Button>
            </Flex>
            <Grid templateColumns="repeat(auto-fit, minmax(92px, 1fr))">
              {users
              .filter((u) => u.id !== user.id)
              .map((u) => {
                return (
                  <GridItem key={u.id}>
                    <UserForm key={u.id} user={u} selected={selectedUserIds.indexOf(u.id) !== -1} onClick={onUserFormClick} />
                  </GridItem>
                );
              })}
            </Grid>
            <Flex justifyContent="center">
              <HStack>
                <Button isDisabled={selectedUserIds.length === 0} onClick={textSendingModalDisclosure.onOpen}>テキストを共有する</Button>
                <form onChange={onFileInputChange} onSubmit={(e) => e.preventDefault()}>
                  <Button isDisabled={selectedUserIds.length === 0} onClick={() => refInputFile.current.click()}>ファイルを共有する</Button>
                  <input type="file" multiple ref={refInputFile} style={{ display: 'none' }} />
                </form>
              </HStack>
            </Flex>
          </Stack>
          ) : (
          <Box py={16}>
            <Center>
              <Invitation shareKey={shareKey} onPinInputComplete={onPinInputComplete}/>
            </Center>
          </Box>
        )}
      </Box>
    </>
  );
}

const container = document.getElementById('app');
const root = createRoot(container);
root.render(
  <StrictMode>
    <ChakraProvider>
      <Page socket={io()} />
    </ChakraProvider>
  </StrictMode>,
)
