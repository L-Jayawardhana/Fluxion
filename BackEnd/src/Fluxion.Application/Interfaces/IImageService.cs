namespace Fluxion.Application.Interfaces;

public interface IImageService
{
    Task<string> UploadImageAsync(Stream imageStream, string fileName);
    Task<bool> DeleteImageAsync(string publicId);
}
