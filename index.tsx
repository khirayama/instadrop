import { createRoot } from 'react-dom/client'
import React, { useState, useEffect, useCallback, createRef, FormEvent, StrictMode } from 'react'
import { io, Socket } from 'socket.io-client'
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
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  useClipboard
} from '@chakra-ui/react'
import { CopyIcon } from '@chakra-ui/icons'
import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import * as qs from 'query-string'

import { FileRecieveModal } from './components/FileRecieveModal'
import { UserForm, Props as UserFormProps } from './components/UserForm'
import { Invitation } from './components/Invitation'

i18next
  .use(LanguageDetector)
  .init({
    detection: {
      lookupQuerystring: 'hl'
    },
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          createNewSpaceButton: 'START NEW SHARING',
          you: 'You',
          sharableUsers: 'Sharable Users',
          inviteButton: 'INVITE',
          shareTextButton: 'SHARE TEXT',
          shareFileButton: 'SHARE FILES',
          invite: 'Invite',
          loadingShareKey: 'Loading',
          copy: 'COPY',
          copyToast: 'Copied',
          join: 'Join',
          shareKeyInputPlaceholder: '4-digit share key',
          sharedFileMessage: 'Shared {{count}} files',
          closeButton: 'CLOSE',
          recieveButton: 'RECIEVE',
          shareText: 'Share Text',
          shareTextPlaceholder: 'Input text',
          submitButton: 'SUBMIT',
          sharedTextMessage: 'Shared text',
          qrcodeAlt: 'QR Code for {{shareKey}}'
        }
      },
      ja: {
        translation: {
          createNewSpaceButton: '新しい共有をはじめる',
          you: 'あなた',
          sharableUsers: '共有可能な相手',
          inviteButton: '招待する',
          shareTextButton: 'テキストを共有する',
          shareFileButton: 'ファイルを共有する',
          invite: '招待する',
          loadingShareKey: '取得中',
          copy: 'コピー',
          copyToast: 'コピーしました',
          join: '参加する',
          shareKeyInputPlaceholder: '4桁の共有キーを入力',
          sharedFileMessage: '{{count}}件のファイルが共有されました',
          closeButton: '閉じる',
          recieveButton: '受け取る',
          shareText: 'テキストを共有',
          shareTextPlaceholder: 'テキストを入力',
          submitButton: '送信',
          sharedTextMessage: 'テキストを共有されました',
          qrcodeAlt: '{{shareKey}}のQRコード'
        }
      }
    }
  }).catch(err => {
    throw err
  })

const t = i18next.t

export interface User {
  id: string
  name: string
  icon: string
  device: string
  browser: string
}

interface Props {
  socket: Socket
}

export function basePath (hl: string): string {
  const defaultLng = i18next.options.fallbackLng[0]
  if (hl === defaultLng) {
    return '/'
  }
  return `/${hl}/`
}

function Page (props: Props): JSX.Element {
  const socket = props.socket

  const [user, setUser] = useState<User>({ id: '', name: '', icon: '' })
  const [users, setUsers] = useState([])
  const [shareKey, setShareKey] = useState('')
  const [files, setFiles] = useState([])
  const [inputText, setInputText] = useState('')
  const [text, setText] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [hl, setHl] = useState(i18next.resolvedLanguage)

  const invitationModalDisclosure = useDisclosure()
  const fileRecieveModalDisclosure = useDisclosure()
  const textSendingModalDisclosure = useDisclosure()
  const textRecieveModalDisclosure = useDisclosure()
  const { onCopy } = useClipboard(text)
  const toast = useToast()

  const refInputFile = createRef()

  useEffect(() => {
    function popstateHandler (): void {
      socket.disconnect()
      socket.connect()
    }

    socket.on('update:user', (d) => {
      setShareKey(d.key)
      setUser(d.user)
      const q = qs.parse(location.search)
      q.key = d.key
      history.replaceState(null, '', `/?${qs.stringify(q)}`)
    })

    socket.on('update:users', (d) => {
      setUsers(d.users)
    })

    socket.on('share:files', (payload) => {
      const fs = payload.files.map((f) => new File([f.data], f.name, { type: f.type }))
      setFiles(fs)
      fileRecieveModalDisclosure.onOpen()
    })

    socket.on('share:text', (payload) => {
      setText(payload.text)
      textRecieveModalDisclosure.onOpen()
    })

    window.addEventListener('popstate', popstateHandler)

    return function cleanup () {
      socket.off('update:user')
      socket.off('update:users')
      socket.off('share:files')
      socket.off('share:text')
      window.removeEventListener('popstate', popstateHandler)
    }
  })

  const onCreateNewSpaceButton = useCallback(() => {
    const q = qs.parse(location.search)
    delete q.key
    history.pushState(null, '', `/?${qs.stringify(q)}`)
    socket.disconnect()
    socket.connect()
  }, [])

  const onLanguageSelectChange = useCallback((event: FormEvent<SelectHTMLElement>) => {
    const q = qs.parse(location.search)
    const hl = event.currentTarget.value
    q.hl = hl
    history.replaceState(null, '', `/?${qs.stringify(q)}`)
    i18next.changeLanguage(hl).catch(err => {
      throw err
    })
    setHl(hl)
  }, [hl, setHl])

  const onPinInputComplete = useCallback((newShareKey) => {
    const q = qs.parse(location.search)
    q.key = newShareKey
    history.pushState(null, '', `/?${qs.stringify(q)}`)
    socket.disconnect()
    socket.connect()
  }, [])

  const onPaste = useCallback((event: ClipboardEvent<HTMLFormElement>) => {
    if (event.clipboardData.types[0] === 'Files') {
      const dt = new DataTransfer()
      for (let i = 0; i < event.clipboardData.items.length; i += 1) {
        const item = event.clipboardData.items[i]
        dt.items.add(item.getAsFile())
      }
      refInputFile.current.files = dt.files
      refInputFile.current.dispatchEvent(new Event('change', { bubbles: true }))
      setInputText('')
      textSendingModalDisclosure.onClose()
    }
  }, [refInputFile, setInputText, textSendingModalDisclosure])

  const onUserFormClick = useCallback((event: MouseEvent<HTMLDivElement>, userFormProps: UserFormProps) => {
    if (userFormProps.selected) {
      const newSelectedUsers = selectedUserIds.filter((userId) => {
        return userFormProps.user.id !== userId
      })
      setSelectedUserIds(newSelectedUsers)
    } else {
      setSelectedUserIds([...selectedUserIds, userFormProps.user.id])
    }
  }, [selectedUserIds])

  const onFileInputChange = useCallback((event: FormEvent<HTMLInputElement>) => {
    const el = event.target
    if (el.type === 'file') {
      const fs = Array.from(el.files).map((f: File) => {
        return {
          name: f.name,
          type: f.type,
          data: f
        }
      })
      const payload = {
        to: selectedUserIds,
        files: fs
      }
      socket.emit('share:files', payload, (res) => {
        if (res.status === 'ok') {
          el.value = ''
          toast({
            title: t('sharedFileMessage', { count: fs.length }),
            duration: 4000
          })
          setSelectedUserIds([])
        }
      })
    }
  }, [users, selectedUserIds])

  const onTextSubmit = useCallback((event: FormEvent<HTMLInputElement>) => {
    event.preventDefault()
    const payload = {
      to: selectedUserIds,
      text: inputText
    }
    socket.emit('share:text', payload, (res) => {
      if (res.status === 'ok') {
        setInputText('')
        toast({
          title: t('sharedTextMessage'),
          duration: 4000
        })
        setSelectedUserIds([])
        textSendingModalDisclosure.onClose()
      }
    })
  }, [user, selectedUserIds, inputText])

  return (
    <>
      <Modal onClose={invitationModalDisclosure.onClose} isOpen={invitationModalDisclosure.isOpen} isCentered>
        <ModalOverlay />
        <ModalContent w="88%" maxW="420px">
          <ModalCloseButton />
          <ModalBody p={4}>
            <Invitation hl={hl} shareKey={shareKey} onPinInputComplete={(newShareKey) => {
              onPinInputComplete(newShareKey)
              invitationModalDisclosure.onClose()
            }}/>
          </ModalBody>
          <ModalFooter>
            <Button onClick={invitationModalDisclosure.onClose}>閉じる</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal onClose={textSendingModalDisclosure.onClose} isOpen={textSendingModalDisclosure.isOpen} isCentered>
        <ModalOverlay />
        <ModalContent w="88%" maxW="420px" maxH="88%">
          <ModalHeader>{t('shareText')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={onTextSubmit} onPaste={onPaste} >
              <ButtonGroup w="100%">
                <Input autoFocus w="100%" placeholder={t('shareTextPlaceholder')} value={inputText} onChange={(e) => setInputText(e.currentTarget.value)} />
                <Button type="submit">{t('submitButton')}</Button>
              </ButtonGroup>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button onClick={textSendingModalDisclosure.onClose}>{t('closeButton')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <FileRecieveModal disclosure={fileRecieveModalDisclosure} files={files} />

      <Modal onClose={textRecieveModalDisclosure.onClose} isOpen={textRecieveModalDisclosure.isOpen} isCentered>
        <ModalOverlay />
        <ModalContent w="88%" maxW="420px" maxH="88%">
          <ModalHeader>{t('sharedTextMessage')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex>
              <ButtonGroup w="100%" isAttached variant='outline' onClick={() => {
                toast({
                  title: t('copyToast'),
                  duration: 4000
                })
                onCopy()
              }}>
                <Button w="100%" justifyContent="left">{text}</Button>
                <IconButton icon={<CopyIcon />} />
              </ButtonGroup>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button onClick={textRecieveModalDisclosure.onClose}>{t('closeButton')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Button
        p={4}
        w="100%"
        h="100%"
        bg="blue.100"
        borderRadius="none"
        color="gray.700"
        variant="link"
        onClick={onCreateNewSpaceButton}
      >{t('createNewSpaceButton')}</Button>

      <Divider />

      <Box p={4}>
        <Stack>
          <Flex>
            <Center>
              <Heading as="h3" size="sm">{t('you')}</Heading>
            </Center>
            <Spacer />
            <Box>
              <Select onChange={onLanguageSelectChange} value={hl}>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </Select>
            </Box>
          </Flex>
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
        {users.length > 1
          ? (
          <Stack p={4}>
            <Flex>
              <Center>
                <Heading as="h3" size="sm">{t('sharableUsers')}</Heading>
              </Center>
              <Spacer />
              <Button
                justifyContent="left"
                onClick={invitationModalDisclosure.onOpen}
              >{t('inviteButton')}</Button>
            </Flex>
            <Grid templateColumns="repeat(auto-fit, minmax(92px, 1fr))">
              {users
                .filter((u) => u.id !== user.id)
                .map((u) => {
                  return (
                  <GridItem key={u.id}>
                    <UserForm key={u.id} user={u} selected={selectedUserIds.includes(u.id)} onClick={onUserFormClick} />
                  </GridItem>
                  )
                })}
            </Grid>
            <Flex justifyContent="center">
              <HStack>
                <Button isDisabled={selectedUserIds.length === 0} onClick={textSendingModalDisclosure.onOpen}>{t('shareTextButton')}</Button>
                <form onChange={onFileInputChange} onSubmit={(e) => e.preventDefault()}>
                  <Button isDisabled={selectedUserIds.length === 0} onClick={() => refInputFile.current.click()}>{t('shareFileButton')}</Button>
                  <input type="file" multiple ref={refInputFile} style={{ display: 'none' }} />
                </form>
              </HStack>
            </Flex>
          </Stack>
            )
          : (
          <Box py={16}>
            <Center>
              <Invitation hl={hl} shareKey={shareKey} onPinInputComplete={onPinInputComplete}/>
            </Center>
          </Box>
            )}
      </Box>
    </>
  )
}

const container = document.getElementById('app')
const root = createRoot(container)
root.render(
  <StrictMode>
    <ChakraProvider>
      <Page socket={io()} />
    </ChakraProvider>
  </StrictMode>
)
