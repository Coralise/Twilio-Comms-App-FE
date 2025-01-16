import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="loader" />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .loader {
    clear: both;
    margin: 1rem auto;
    width: 3.125rem;
    height: 1.125rem;
    border: 1px #fff solid;
    border-radius: 4px;
    background: linear-gradient(-60deg, transparent 0%, transparent 50%, #fff 50%, #fff 75%, transparent 75%, transparent);
    background-size: 20px 30px;
    background-position: 0px 0px;
    animation: spLoadBar 0.8s infinite linear;
  }

  @keyframes spLoadBar {
    from {
      background-position: 0px 0px;
    }

    to {
      background-position: -20px 0px;
    }
  }`;

export default Loader;
