import React, { MouseEvent } from 'react'

import { User } from '../index'
import {
  Avatar,
  AvatarBadge,
  Box,
  Stack,
  Center,
  Text,
  Heading
} from '@chakra-ui/react'

export interface Props {
  user: User
  selected: boolean
  onClick: (event: MouseEvent<HTMLDivElement>, props: Props) => void
}

export function UserForm (props: Props): JSX.Element {
  return (
    <Box
      onClick={(event) => props.onClick(event, props)}
      opacity={ props.selected ? '0.54' : '1' }
      cursor="pointer"
      userSelect="none"
      py={4}
    >
      <Center>
        <Avatar
          size='lg'
          bg='blue.400'
          icon={<Text>{props.user.icon}</Text>}
        >
          { props.selected ? <AvatarBadge boxSize='1.25em' bg='green.500' /> : null }
        </Avatar>
      </Center>
      <Center>
        <Stack spacing={0}>
          <Heading as="h3" size="sm" textAlign="center" pt={2}>{props.user.name}</Heading>
          <Text textAlign="center">{props.user.device}</Text>
          <Text textAlign="center">{props.user.browser}</Text>
        </Stack>
      </Center>
    </Box>
  )
}
