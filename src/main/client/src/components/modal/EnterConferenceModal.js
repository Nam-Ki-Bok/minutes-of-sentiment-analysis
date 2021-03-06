import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import palette from '../../lib/styles/palette';
import { enterConference } from '../../controllers/meeting';

const Container = styled.div`
  position: relative;
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
`;

const ContentWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 2.5rem 0 0.5rem;

  .subTitle {
    font-size: 18px;
    font-weight: bold;
    color: ${palette.black};
    margin-right: 2rem;
  }

  input {
    height: 36px;
    width: 360px;
    font-size: 18px;
    color: ${palette.gray4};
    border: 0.5px solid ${palette.gray2};
    padding: 1rem;
    display: flex;
    align-items: center;
  }
`;

const BtnWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 40px;
`;

const OkBtn = styled.button`
  width: 140px;
  height: 60px;
  background: ${({ color }) =>
    color === 'orange'
      ? css`
          ${palette.orange1}
        `
      : css`
          ${palette.red}
        `};
  color: ${palette.white};
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
`;

const CancleBtn = styled.button`
  width: 140px;
  height: 60px;
  background: ${palette.gray2};
  color: ${palette.white};
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  margin-left: 32px;
`;

function EnterConferenceModal({ ModalOff, args }) {
  const [inputValue, setInputValue] = useState('');
  const onChange = (e) => {
    setInputValue(e.target.value);
  };

  const joinMeetingRoom = () => {
    enterConference(inputValue);
    ModalOff();
  };

  return (
    <Container>
      <ContentWrapper>
        <span className="subTitle">회의 코드</span>
        <input type="text" onChange={onChange} />
      </ContentWrapper>
      <BtnWrapper>
        <OkBtn
          color={args.okBtnBackgroundColor}
          onClick={() => joinMeetingRoom()}
        >
          {args.okBtnText}
        </OkBtn>
        <CancleBtn onClick={ModalOff}>취소</CancleBtn>
      </BtnWrapper>
    </Container>
  );
}

export default EnterConferenceModal;
