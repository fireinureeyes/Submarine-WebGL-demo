function Light () {
  //this.lightDirection = new Vector3(1, 40, 5)
  this.lightDirection = new Vector3(1, 40, 5)
  this.ambientLight = 0.25
  this.lightsOn = 1.0;
}

Light.prototype.use = function (shaderProgram) {
  var dir = this.lightDirection
  var gl = shaderProgram.gl
  gl.uniform3f(shaderProgram.lightDirection, dir.x, dir.y, dir.z)
  gl.uniform1f(shaderProgram.ambientLight, this.ambientLight)
  gl.uniform1f(shaderProgram.lightsOn, this.lightsOn)
}
