/**
 * -GE CONFIDENTIAL-
 * Type: Source Code
 *
 * Copyright (c) 2021, GE Healthcare
 * All Rights Reserved
 *
 * This unpublished material is proprietary to GE Healthcare. The methods and
 * techniques described herein are considered trade secrets and/or
 * confidential. Reproduction or distribution, in whole or in part, is
 * forbidden except by express written permission of GE Healthcare.
 */

import { Component } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { Tesseract } from "tesseract.ts";
import * as Image from 'image-js';
//import * as wasm from 'edge-detection-wasm';
//import '!!file-loader?name=edge_detection_wasm_bg.wasm!./edge_detection_wasm_bg.wasm'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'ecgdigi';
  // latest snapshot
  public showWebcam = false;
  public allowCameraSwitch = false;
  public videoOptions: MediaTrackConstraints = {
    // width: {ideal: 1024},
    // height: {ideal: 576}
  };
  public ocrResult = '';

  public webcamImage: WebcamImage = new WebcamImage('', 'image/*', new ImageData(640, 480));

  public greyImageUrl: string = '';
  public greyImageWidth: number = 0;
  public greyImageHeight: number = 0;

  public edgyImage: Image.Image = new Image.Image(640,480);

  public edgyUrl: string = '';

  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();

  public toggleWebcam(): void {
    this.showWebcam = !this.showWebcam;
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public handleImage(webcamImage: WebcamImage): void {
    console.info('received webcam image', webcamImage);
    this.webcamImage = webcamImage;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public testOcr(): void {
    var self = this;
    if (this.webcamImage.imageAsDataUrl === '') {
      self.ocrResult = '--empty image--';
      return;
    }

    self.ocrResult = 'working...';
    Tesseract.recognize(this.webcamImage.imageAsDataUrl)
      .progress(function(progress : Tesseract.Progress) {
        self.ocrResult = 'working...' + progress.status + ' ' + progress.progress.toLocaleString(undefined, {style: 'percent', minimumFractionDigits:0});
      })
      .then(function(result: { text: string; }) {
        self.ocrResult = result.text;
      })
      .catch(console.error);
  }

  public makeGreyImage(): void {
    var self = this;
    Image.Image.load(this.webcamImage.imageAsDataUrl)
      .then(function(image) {
        var greyImage = image.grey();
        self.greyImageUrl = greyImage.toDataURL();
        self.greyImageWidth = greyImage.width;
        self.greyImageHeight = greyImage.height;
      });
  }

  //public convertDataUrlToUint8ClampedArray(dataUrl: string): Uint8ClampedArray {
  //  const arr = dataUrl.split(',');
  //  const bstr = atob(arr[1]);
  //  let n = bstr.length;
  //  const u8arr = new Uint8Array(n);

  //  while (n--) {
  //    u8arr[n] = bstr.charCodeAt(n);
  //  }

  //  return new Uint8ClampedArray(u8arr);
  //}

  //public doEdgeDetection(): void {
  //  var self = this;
    
  //  wasm.default('./edge_detection_wasm_bg.wasm')
  //    .then(function (any) {
  //      var edgy = wasm.detect(self.convertDataUrlToUint8ClampedArray(self.greyImageUrl),
  //        self.greyImageWidth,
  //        self.greyImageHeight,
  //        0xFFFFFFFF, false);
  //      self.edgyImage = new Image.Image(self.greyImageWidth, self.greyImageHeight, edgy);
  //      self.edgyUrl = self.edgyImage.toDataURL();
  //    });
  //}
}
