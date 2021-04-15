import React from 'react';
import styled from 'styled-components';
import palette from '../../lib/styles/palette';

const Container = styled.div`
  position: fixed;
  top: 0;
  width: 100%;
  height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  padding: 0 75px;
  border-bottom: 0.5px solid ${palette.gray2};
  background: ${palette.white};
`;

function Wrapper({ children }) {
  return <Container>{children}</Container>;
}

export default Wrapper;