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
  public multipleWebcamsAvailable = false;
  public deviceId: string = "";
  public facingMode: string = 'environment';
  public errors: WebcamInitError[] = [];

  public webcamImage: WebcamImage = null as any;

  
  public greyImageUrl: string = '';
  public greyImageWidth: number = 0;
  public greyImageHeight: number = 0;

  public ocrResult = '';

  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();

  private nextWebcam: Subject<boolean | string> = new Subject<boolean | string>();

  public ngOnInit(): void {
    WebcamUtil.getAvailableVideoInputs()
      .then((mediaDevices: MediaDeviceInfo[]) => {
        this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
      });
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public toggleWebcam(): void {
    this.showWebcam = !this.showWebcam;
  }

  handleInitError(error: WebcamInitError): void {
    if (error.mediaStreamError && error.mediaStreamError.name === 'NotAllowedError') {
      console.warn('Camera access was not allowed by user!');
    }
    this.errors.push(error);
  }

  public showNextWebcam(directionOrDeviceId: boolean | string): void {
    // true => move forward through devices
    // false => move backwards through devices
    // string => move to device with given deviceId
    this.nextWebcam.next(directionOrDeviceId);
  }

  public handleImage(webcamImage: WebcamImage): void {
    console.info('received webcam image', webcamImage);
    this.webcamImage = webcamImage;
  }

  public cameraWasSwitched(deviceId: string): void {
    console.log('active device: ' + deviceId);
    this.deviceId = deviceId;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public get nextWebcamObservable(): Observable<boolean | string> {
    return this.nextWebcam.asObservable();
  }

  public get videoOptions(): MediaTrackConstraints {
    const result: MediaTrackConstraints = {};
    if (this.facingMode && this.facingMode !== '') {
      result.facingMode = { ideal: this.facingMode };
    }

    return result;
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

}
