function Mesh (gl, geometry, texture) {
  var vertexCount = geometry.vertexCount()
  this.positions = new VBO(gl, geometry.positions(), vertexCount)
  this.normals = new VBO(gl, geometry.normals(), vertexCount)
  this.uvs = new VBO(gl, geometry.uvs(), vertexCount)
  this.texture = texture
  this.vertexCount = vertexCount
  this.position = new Transformation()
  this.gl = gl
  //default material values
  this.ambient = new Vector3(0.4, 0.4,0.4);
  this.diffuse = new Vector3(0.4, 0.4,0.4);
  this.specular = new Vector3(0.4, 0.4,0.4);
  this.emission = new Vector3(0.0, 0.0, 0.0);
  this.shininess = 5.0;
  this.group = 1.0;
}

Mesh.prototype.destroy = function () {
  this.positions.destroy()
  this.normals.destroy()
  this.uvs.destroy()
}

Mesh.prototype.draw = function (shaderProgram) {
  this.positions.bindToAttribute(shaderProgram.position)
  this.normals.bindToAttribute(shaderProgram.normal)
  this.uvs.bindToAttribute(shaderProgram.uv)

  gl.uniform3f(shaderProgram.ambientColor, this.ambient.x, this.ambient.y, this.ambient.z)
  gl.uniform3f(shaderProgram.diffuseColor, this.diffuse.x, this.diffuse.y, this.diffuse.z)
  gl.uniform3f(shaderProgram.specularColor, this.specular.x, this.specular.y, this.specular.z)
  gl.uniform3f(shaderProgram.emission, this.emission.x, this.emission.y, this.emission.z)
  gl.uniform1f(shaderProgram.shininess, this.shininess)
  gl.uniform1f(shaderProgram.group, this.group)

  this.position.sendToGpu(this.gl, shaderProgram.model)
  this.texture.use(shaderProgram.diffuse, 0)
  this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexCount)
}

Mesh.load = function (gl, modelUrl, textureUrl) {
  var geometry = Geometry.loadOBJ(modelUrl)
  var texture = Texture.load(gl, textureUrl)
  return Promise.all([geometry, texture]).then(function (params) {
    return new Mesh(gl, params[0], params[1], params[2])
  })
}
