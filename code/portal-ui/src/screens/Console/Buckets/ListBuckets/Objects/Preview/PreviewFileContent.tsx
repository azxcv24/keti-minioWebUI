// This file is part of MinIO Console Server
// Copyright (c) 2021 MinIO, Inc.
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

import React, { Fragment, useCallback, useEffect, useState } from "react";
import createStyles from "@mui/styles/createStyles";
import withStyles from "@mui/styles/withStyles";
import { Grid } from "@mui/material";
import { BucketObjectItem } from "../ListObjects/types";
import { AllowedPreviews, previewObjectType } from "../utils";
import { encodeURLString } from "../../../../../../common/utils";
import clsx from "clsx";
import WarningMessage from "../../../../Common/WarningMessage/WarningMessage";
import { api } from "../../../../../../api";
import get from "lodash/get";
import { ProgressBar } from "mds";

const styles = () =>
  createStyles({
    iframeContainer: {
      border: "0px",
      flex: "1 1 auto",
      width: "100%",
      height: 250,
      backgroundColor: "transparent",
      borderRadius: 5,

      "&.image": {
        height: 500,
      },
      "&.text": {
        height: 700,
      },
      "&.audio": {
        height: 150,
      },
      "&.video": {
        height: 350,
      },
      "&.fullHeight": {
        height: "calc(100vh - 185px)",
      },
    },
    iframeBase: {
      backgroundColor: "#fff",
    },
    iframeHidden: {
      display: "none",
    },
  });

interface IPreviewFileProps {
  bucketName: string;
  object: BucketObjectItem | null;
  isFullscreen?: boolean;
  classes: any;
  isPaging?: boolean;
}

const PreviewFile = ({
  bucketName,
  object,
  isFullscreen = false,
  classes,
  isPaging = false,
}: IPreviewFileProps) => {
  const [loading, setLoading] = useState<boolean>(true);

  const [metaData, setMetaData] = useState<any>(null);
  const [isMetaDataLoaded, setIsMetaDataLoaded] = useState(false);

  const objectName = object?.name || "";

  const fetchMetadata = useCallback(() => {
    if (!isMetaDataLoaded) {
      const encodedPath = encodeURLString(objectName);
      api.buckets
        .getObjectMetadata(bucketName, {
          prefix: encodedPath,
        })
        .then((res) => {
          let metadata = get(res.data, "objectMetadata", {});
          setIsMetaDataLoaded(true);
          setMetaData(metadata);
        })
        .catch((err) => {
          console.error(
            "Error Getting Metadata Status: ",
            err,
            err?.detailedError,
          );
          setIsMetaDataLoaded(true);
        });
    }
  }, [bucketName, objectName, isMetaDataLoaded]);

  useEffect(() => {
    if (bucketName && objectName) {
      fetchMetadata();
    }
  }, [bucketName, objectName, fetchMetadata]);

  let path = "";
  let csvpath = "";

  if (object) {
    const encodedPath = encodeURLString(object.name);
    let basename = document.baseURI.replace(window.location.origin, "");
    path = `${window.location.origin}${basename}api/v1/buckets/${bucketName}/objects/download?preview=true&prefix=${encodeURIComponent(encodedPath)}`;
    if (object.version_id) {
      path = path.concat(`&version_id=${object.version_id}`);
    }
    if (isPaging) {
      csvpath = `${window.location.origin}${basename}ktsearch/csv/preview?bucket=${bucketName}&prefix=${encodeURIComponent(encodedPath)}&format=ag`;
      if (object.version_id) {
        csvpath = csvpath.concat(`&version_id=${object.version_id}`);
      }
    } else {
      csvpath = `${window.location.origin}${basename}_api/csv/preview?bucket=${bucketName}&prefix=${encodeURIComponent(encodedPath)}&format=lucky`;
      if (object.version_id) {
        csvpath = csvpath.concat(`&version_id=${object.version_id}`);
      }
    }
  }

  let objectType: AllowedPreviews = previewObjectType(metaData, objectName);
  const metaContentType = ((metaData && metaData["Content-Type"]) || "").toString();

  const iframeLoaded = () => {
    setLoading(false);
  };

  return (
    <Fragment>
      {objectType !== "none" && loading && (
        <Grid item xs={12}>
          <ProgressBar />
        </Grid>
      )}
      {isMetaDataLoaded ? (
        <div style={{ textAlign: "center" }}>
          {objectType === "video" && (
            <video
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "calc(100vw - 100px)",
                maxHeight: "calc(100vh - 200px)",
              }}
              autoPlay={true}
              controls={true}
              muted={false}
              playsInline={true}
              onPlay={iframeLoaded}
            >
              <source src={path} type="video/mp4" />
            </video>
          )}
          {objectType === "audio" && (
            <audio
              style={{
                width: "100%",
                height: "auto",
              }}
              autoPlay={true}
              controls={true}
              muted={false}
              playsInline={true}
              onPlay={iframeLoaded}
            >
              <source src={path} type="audio/mpeg" />
            </audio>
          )}
          {objectType === "image" && (
            <img
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "100vw",
                maxHeight: "100vh",
              }}
              src={path}
              alt={"preview"}
              onLoad={iframeLoaded}
            />
          )}
          {objectType === "none" && (
            <div>
              <WarningMessage
                label=" File couldn't be previewed using file extension or mime type. Please
            try Download instead"
                title="Preview unavailable "
              />
            </div>
          )}
          {metaContentType == 'text/csv' && (
            <div
              className={clsx(classes.iframeBase, {
                [classes.iframeHidden]: loading,
              })}
            >
              <iframe
                src={isPaging ? `/sheet-paging?url=${encodeURIComponent(csvpath)}` : `/sheet?url=${encodeURIComponent(csvpath)}`}
                title="File Preview"
                allowTransparency
                className={`${classes.iframeContainer} ${"fullHeight"}`}
                onLoad={iframeLoaded}
              >
                File couldn't be loaded. Please try Download instead
              </iframe>
            </div>
          )}
          {objectType !== "none" &&
            objectType !== "video" &&
            objectType !== "audio" &&
            objectType !== "image" &&
            metaContentType !== 'text/csv' && (
              <div
                className={clsx(classes.iframeBase, {
                  [classes.iframeHidden]: loading,
                })}
              >
                <iframe
                  src={path}
                  title="File Preview"
                  allowTransparency
                  className={`${classes.iframeContainer} ${
                    isFullscreen ? "fullHeight" : objectType
                  }`}
                  onLoad={iframeLoaded}
                >
                  File couldn't be loaded. Please try Download instead
                </iframe>
              </div>
            )}
        </div>
      ) : null}
    </Fragment>
  );
};
export default withStyles(styles)(PreviewFile);
