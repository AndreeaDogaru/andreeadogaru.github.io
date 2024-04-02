// https://segments.ai/blog/simulating-cameras-three-js

import {
    Matrix4,
    PerspectiveCamera
  } from "three";
  

function makeNdcMatrix(
    left,
    right,
    bottom,
    top,
    near,
    far
  ) {
    const tx = -(right + left) / (right - left);
    const ty = -(top + bottom) / (top - bottom);
    const tz = -(far + near) / (far - near);
  
    const ndc = new Matrix4();
    // prettier-ignore
    ndc.set(
        2 / (right - left), 0, 0, tx,
        0, 2 / (top - bottom), 0, ty,
        0, 0, -2 / (far - near), tz,
        0, 0, 0, 1,
      );
    return ndc;
  }
  
  function makePerspectiveMatrix(
    s,
    alpha,
    beta,
    x0,
    y0,
    near,
    far
  ) {
    const A = near + far;
    const B = near * far;
  
    const perspective = new Matrix4();
    // prettier-ignore
    perspective.set(
        alpha, s, x0, 0,
        0, beta, y0, 0,
        0, 0, -A, B,
        0, 0, 1, 0,
      );
    return perspective;
  }

export default class PinholeCamera extends PerspectiveCamera {
K;
imageWidth;
imageHeight;

constructor(
    K,
    imageWidth,
    imageHeight,
    aspect,
    near,
    far
) {
    super(45, aspect, near, far);

    this.K = K;
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;
    this.updateProjectionMatrix();
}

updateProjectionMatrix() {
    if (!this.K) {
      return;
    }
    const fx = this.K[0][0];
    const fy = this.K[1][1];
    const ox = this.K[0][2];
    const oy = this.K[1][2];
    const s = this.K[0][1];
  
    const imageAspect = this.imageWidth / this.imageHeight;
    const relAspect = this.aspect / imageAspect;
  
    const relAspectFactorX = Math.max(1, relAspect);
    const relAspectFactorY = Math.max(1, 1 / relAspect);
  
    const relAspectOffsetX = ((1 - relAspectFactorX) / 2) * this.imageWidth;
    const relAspectOffsetY = ((1 - relAspectFactorY) / 2) * this.imageHeight;

    const left = relAspectOffsetX;
    const right = this.imageWidth - relAspectOffsetX;
    const top = relAspectOffsetY;
    const bottom = this.imageHeight - relAspectOffsetY;
  
    const persp = makePerspectiveMatrix(s, fx, fy, ox, oy, this.near, this.far);
    const ndc = makeNdcMatrix(left, right, bottom, top, this.near, this.far);
    const corr = new Matrix4();
    // prettier-ignore
    corr.set(
        1, 0, 0, 0,
        0, -1, 0, 0,
        0, 0, -1, 0,
        0, 0, 0, 1,
      );
    const projection = ndc.multiply(persp).multiply(corr);
  
    this.projectionMatrix.copy(projection);
    this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
}
}