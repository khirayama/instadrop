import {
  Button,
  Box,
  Text,
  Code,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'
import i18next from 'i18next';
import { Navigation, Pagination } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react/swiper-react.js'; // TODO

import 'swiper/swiper-bundle.min.css'
import 'swiper/swiper.min.css'

const t = i18next.t;

type FileRecieveModalProps = {
  files: any[]; // TODO
  disclosure: any; // TODO
};

export function FileRecieveModal(props: FileRecieveModalProps) {
  const dc = props.disclosure;
  const files = props.files;

  return (
    <Modal onClose={dc.onClose} isOpen={dc.isOpen} isCentered>
      <ModalOverlay />
      <ModalContent maxW="88%">
        <ModalHeader>{t('sharedFilesMessage', { count: files.length })}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Swiper
            modules={[Pagination, Navigation]}
            pagination={{ clickable: true }}
          >
            {
              files
              .map((f) => {
                const obj = window.URL.createObjectURL(f);
                let preview = null;
                if (f.type.indexOf('image') == 0) {
                  preview = (
                    <Box>
                      <Image src={obj} />
                    </Box>
                  );
                } else if (f.type.indexOf('text') == 0) {
                  if (!files[f.name]) {
                    f.text().then((res) => {
                      const fs = {
                        ...files,
                        [f.name]: res,
                      };
                    });
                  }
                  preview = (
                    <Box>
                      <Text>{f.name}</Text>;
                      <Code>{files[f.name]}</Code>
                    </Box>
                  );
                } else {
                  preview = <Box>{f.name}</Box>;
                }
                return (
                  <SwiperSlide key={f.name}>
                    <Box style={{height: '100%'}}>
                      <a href={obj} download={f.name} />
                      {preview}
                    </Box>
                  </SwiperSlide>
                );
              })
            }
          </Swiper>
        </ModalBody>
        <ModalFooter>
          <Button onClick={dc.onClose}>{t('closeButton')}</Button>
          <Button variant='ghost' onClick={() => {
            Array.from(document.querySelectorAll('a[download]')).forEach((el) => el.click());
          }}>{t('recieveButton')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
