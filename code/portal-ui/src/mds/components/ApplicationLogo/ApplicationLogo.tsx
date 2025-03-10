// This file is part of MinIO Design System
// Copyright (c) 2022 MinIO, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React, { FC } from "react";
import styled from "styled-components";
import Grid from "../Grid/Grid";
import { ApplicationLogoProps } from "./ApplicationLogo.types";
import ConsoleStandard from "./Logos/Console/ConsoleStandard";
import ConsoleAGPL from "./Logos/Console/ConsoleAGPL";
import ConsoleEnterprise from "./Logos/Console/ConsoleEnterprise";
import Operator from "./Logos/Operator/Operator";
import DirectPV from "./Logos/DirectPV/DirectPV";
import KES from "./Logos/KES/KES";
import SUBNET from "./Logos/SUBNET/SUBNET";
import ConsoleSingle from "./Logos/Console/ConsoleSingle";
import SubnetOPS from "./Logos/SubnetOPS/SubnetOPS";
import Cloud from "./Logos/Cloud/Cloud";
import Releases from "./Logos/Releases/Releases";
import VMBroker from "./Logos/VMBroker/VMBroker";
import EurekaNew from "./Logos/Eureka/EurekaNew";
import Eureka from "./Logos/Eureka/Eureka";

const Logo = styled.div(({ }) => {
  return {
    "& .mainContainer": {
    },
    "& .logo": {
      width: "100%",
    },
  }
});

const ApplicationLogo: FC<ApplicationLogoProps> = ({
  applicationName,
  subVariant = "simple",
  inverse,
  onClick,
}) => {
  return <Logo>
    <Grid className="mainContainer">
      <img src="/logo_white.png" className="logo" />
    </Grid>
  </Logo>
  switch (applicationName) {
    case "console":
      switch (subVariant) {
        case "standard":
          return <ConsoleStandard inverse={!!inverse} onClick={onClick} />;
        case "enterprise":
          return <ConsoleEnterprise inverse={!!inverse} onClick={onClick} />;
        case "AGPL":
          return <ConsoleAGPL inverse={!!inverse} onClick={onClick} />;
        default:
          return <ConsoleSingle inverse={!!inverse} onClick={onClick} />;
      }
      break;
    case "directpv":
      return <DirectPV inverse={!!inverse} onClick={onClick} />;
    case "subnet":
      return <SUBNET inverse={!!inverse} onClick={onClick} />;
    case "kes":
      return <KES inverse={!!inverse} onClick={onClick} />;
    case "operator":
      return <Operator inverse={!!inverse} onClick={onClick} />;
    case "subnetops":
      return <SubnetOPS inverse={!!inverse} onClick={onClick} />;
    case "cloud":
      return <Cloud inverse={!!inverse} onClick={onClick} />;
    case "releases":
      return <Releases inverse={!!inverse} onClick={onClick} />;
      break;
    case "vmbroker":
      return <VMBroker inverse={!!inverse} onClick={onClick} />;
      break;
    case "eureka":
      switch (subVariant) {
        case "new":
          return <EurekaNew inverse={!!inverse} onClick={onClick} />;
        default:
          return <Eureka inverse={!!inverse} onClick={onClick} />;
      }
      break;
  }
};

export default ApplicationLogo;
